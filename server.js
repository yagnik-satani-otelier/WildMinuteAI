import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildJournalPrompt, buildPrompt, parseJournal, parseMission, validateMissionInput } from './lib/mission.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 4173);
const ollamaUrl = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const model = process.env.OLLAMA_MODEL || 'gemma3:1b';
const BODY_LIMIT = 80 * 1024;
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8'
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'content-length':Buffer.byteLength(body), 'cache-control':'no-store', 'x-content-type-options':'nosniff' });
  res.end(body);
}
function sendText(res, status, body) {
  res.writeHead(status, { 'content-type':'text/plain; charset=utf-8', 'content-length':Buffer.byteLength(body), 'x-content-type-options':'nosniff' });
  res.end(body);
}
async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > BODY_LIMIT) {
      const error = new Error('Request body is too large.'); error.status = 413; throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { const error = new Error('Request body must be valid JSON.'); error.status = 400; throw error; }
}
async function getOllamaTags() {
  const response = await fetch(`${ollamaUrl}/api/tags`, { signal:AbortSignal.timeout(2200) });
  if (!response.ok) throw new Error('Ollama is not responding.');
  return response.json();
}
async function statusPayload() {
  try {
    const data = await getOllamaTags();
    const installed = (data.models || []).some((item) => item.name === model || item.name?.startsWith(`${model}:`));
    return { ollama:true, model, installed, mode:installed ? 'local-ai' : 'fallback' };
  } catch { return { ollama:false, model, installed:false, mode:'fallback' }; }
}
async function generateMission(req, res) {
  let input;
  try { input = validateMissionInput(await readJson(req)); }
  catch (error) { return sendJson(res, error.status || 400, { error:error.message }); }
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method:'POST', headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ model, prompt:buildPrompt(input), stream:false, format:'json', options:{ temperature:0.8, top_p:0.9 } }),
      signal:AbortSignal.timeout(65000)
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    const result = await response.json();
    const mission = parseMission(result.response, input.minutes);
    return sendJson(res, 200, { mission, source:'local-ai', model });
  } catch (error) {
    return sendJson(res, 503, {
      error:error.name === 'TimeoutError' ? 'The local model took too long. Try again or use a smaller Ollama model.' : 'Local AI is not ready yet. Start Ollama and download the model shown in the setup guide.',
      detail:error.message, model
    });
  }
}
async function generateJournal(req, res) {
  let entry;
  try { entry = await readJson(req); }
  catch (error) { return sendJson(res, error.status || 400, { error:error.message }); }
  if (entry.reflection && typeof entry.reflection !== 'string') return sendJson(res, 400, { error:'Reflection must be text.' });
  if (Array.isArray(entry.observations) && entry.observations.length > 30) return sendJson(res, 400, { error:'A journal can include up to 30 observations.' });
  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method:'POST', headers:{ 'content-type':'application/json' },
      body:JSON.stringify({ model, prompt:buildJournalPrompt(entry), stream:false, format:'json', options:{ temperature:0.55, top_p:0.9 } }),
      signal:AbortSignal.timeout(65000)
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    const result = await response.json();
    return sendJson(res, 200, { journal:parseJournal(result.response), source:'local-ai', model });
  } catch (error) {
    return sendJson(res, 503, {
      error:error.name === 'TimeoutError' ? 'The local model took too long to write this journal.' : 'Local AI is not ready. You can still create a journal with the on-device template.',
      detail:error.message, model
    });
  }
}
async function serveStatic(req, res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { return sendText(res, 400, 'Invalid URL path.'); }
  if (decoded.includes('\0')) return sendText(res, 400, 'Invalid URL path.');
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  let target = path.resolve(publicDir, relative);
  if (target !== publicDir && !target.startsWith(`${publicDir}${path.sep}`)) return sendText(res, 403, 'Forbidden.');
  try {
    let fileStat = await stat(target);
    if (fileStat.isDirectory()) { target = path.join(target, 'index.html'); fileStat = await stat(target); }
    if (!fileStat.isFile()) throw new Error('Not a file');
  } catch {
    // Keep simple SPA-style routes useful without returning the shell for API URLs.
    target = path.join(publicDir, 'index.html');
    try { await stat(target); } catch { return sendText(res, 404, 'Not found.'); }
  }
  try {
    const bytes = await readFile(target);
    const headers = { 'content-type':MIME[path.extname(target).toLowerCase()] || 'application/octet-stream', 'content-length':bytes.length, 'x-content-type-options':'nosniff' };
    if (path.basename(target) === 'sw.js') headers['cache-control'] = 'no-cache';
    if (path.extname(target) === '.html') headers['cache-control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { sendText(res, 404, 'Not found.'); }
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsed.pathname;
  try {
    if (pathname === '/api/status' && req.method === 'GET') return sendJson(res, 200, await statusPayload());
    if (pathname === '/api/mission' && req.method === 'POST') return await generateMission(req, res);
    if (pathname === '/api/journal' && req.method === 'POST') return await generateJournal(req, res);
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { error:'API route not found.' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, 'Method not allowed.');
    return await serveStatic(req, res, pathname);
  } catch (error) {
    if (!res.headersSent) sendJson(res, 500, { error:'Unexpected server error.', detail:process.env.NODE_ENV === 'development' ? error.message : undefined });
    else res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`WildMinute is ready at http://127.0.0.1:${port}`);
  console.log(`AI model: ${model} via ${ollamaUrl}`);
  console.log('This server binds to localhost by default; journal notes stay local when run this way.');
});
