const form = document.querySelector('#plannerForm');
const generateButton = document.querySelector('#generateButton');
const statusLabel = document.querySelector('#modelStatus');
const statusDot = document.querySelector('#statusDot');
const resultSection = document.querySelector('#resultSection');
const resultCard = document.querySelector('#resultCard');
const sourcePill = document.querySelector('#sourcePill');
const startButton = document.querySelector('#startButton');
const anotherButton = document.querySelector('#anotherButton');
const timerPanel = document.querySelector('#timerPanel');
const timerDisplay = document.querySelector('#timerDisplay');
const timerCopy = document.querySelector('#timerCopy');
const pauseButton = document.querySelector('#pauseButton');
const finishButton = document.querySelector('#finishButton');
const completionPanel = document.querySelector('#completionPanel');
const reflectionText = document.querySelector('#reflectionText');
const resetButton = document.querySelector('#resetButton');
const fieldNotesPanel = document.querySelector('#fieldNotesPanel');
const observationForm = document.querySelector('#observationForm');
const observationText = document.querySelector('#observationText');
const observationKind = document.querySelector('#observationKind');
const observationPhoto = document.querySelector('#observationPhoto');
const photoPreviewWrap = document.querySelector('#photoPreviewWrap');
const photoPreview = document.querySelector('#photoPreview');
const clearPhotoButton = document.querySelector('#clearPhotoButton');
const observationsList = document.querySelector('#observationsList');
const observationCount = document.querySelector('#observationCount');
const journalCapturePanel = document.querySelector('#journalCapturePanel');
const journalReflection = document.querySelector('#journalReflection');
const generateJournalButton = document.querySelector('#generateJournalButton');
const journalStatus = document.querySelector('#journalStatus');
const journalResultPanel = document.querySelector('#journalResultPanel');
const savedJournalsSection = document.querySelector('#savedJournalsSection');
const savedJournalsList = document.querySelector('#savedJournalsList');

let latestMission = null;
let currentAdventure = null;
let remainingSeconds = 0;
let timerInterval = null;
let paused = false;
let selectedPhotoBlob = null;
let photoPreviewUrl = null;
let dbPromise = null;
let localAiStatus = false;
let renderedObservationUrls = [];
let renderedJournalUrls = [];

const fallbackMissions = [
  { title:'The small-things safari', hook:'The ordinary world is full of things hiding in plain sight.', mission:'Find three tiny details you have never properly noticed in a familiar place.', steps:['Step outside and walk at an unhurried pace.','Spot one shape, one texture, and one surprising colour.','Pause for ten quiet seconds with each discovery.','Head home by a familiar public route.'], notice:'A tiny crack, a leaf edge, a shadow, a sound, or a pattern.', look_for:['A repeating shape or pattern','A leaf, petal or other interesting texture','A shadow changing shape','A sound nearby and another farther away'], route_summary:'Make a short out-and-back from a familiar public starting point, then return the same way.', route_segments:['Begin at a familiar public entrance or doorstep.','Follow a safe path you already know at an unhurried pace.','Pause at a comfortable spot and notice three small details.','Turn back with enough time to return the way you came.'], screen_rule:'Put your phone away. No photos needed: memory is enough.', safety:'Use familiar public paths, watch traffic and uneven ground, and turn back if anything feels unsafe.', reflection:'Which detail made you slow down?', minutes:10 },
  { title:'Borrow five minutes of sky', hook:'You do not need a destination to get a change of scene.', mission:'Find a comfortable spot outdoors and notice how the sky changes from one edge of your view to another.', steps:['Choose a safe spot where you can stand or sit comfortably.','Look at the sky without trying to name or photograph anything.','Notice two kinds of movement, light, or cloud if they are present.','Take three slow breaths, then return when your time is up.'], notice:'The direction of the light and anything moving gently in the distance.', look_for:['One changing patch of light or shade','A cloud shape or clear patch of sky','Something moving in the breeze','A distant sound you usually tune out'], route_summary:'Choose a very short out-and-back, or stay near your doorstep if that is easier.', route_segments:['Start from your doorstep or another comfortable public spot.','Walk or roll along a familiar, level stretch if available.','Stop where you can safely look up without blocking a path.','Return the same way, leaving time to get back comfortably.'], screen_rule:'Leave the phone in your pocket for the whole mission.', safety:'Choose shade when needed, stay hydrated, and skip the activity if conditions feel unsafe.', reflection:'What changed when you gave the sky your full attention?', minutes:10 },
  { title:'A tiny thank-you walk', hook:'Connection can begin with noticing what quietly helps a place feel alive.', mission:'Take a short, unhurried walk and notice three things that make a familiar place feel cared for.', steps:['Pick a familiar, public route.','Notice a small sign of care: a swept step, a tended plant, or a shared space.','Find two more everyday details worth appreciating.','If it feels natural, thank someone who has helped you today.'], notice:'Small acts of care that are easy to overlook.', look_for:['A cared-for plant or shared space','A sign that someone repaired or tended something','A welcoming detail in the neighbourhood','A place where people can rest safely'], route_summary:'Take a familiar neighbourhood out-and-back, without entering private spaces.', route_segments:['Start on a public path you know well.','Move at an easy pace and notice everyday signs of care.','Pause somewhere safe and out of the way.','Return by the same familiar route.'], screen_rule:'No scrolling and no need to document the walk.', safety:'Respect people’s privacy and do not enter private property.', reflection:'What makes a place feel welcoming to you?', minutes:10 },
  { title:'The listening minute', hook:'Let your ears lead for a change.', mission:'Find a safe outdoor spot and notice how many layers of sound share the same moment.', steps:['Stand or sit somewhere safe and comfortable.','Listen for a sound nearby, one farther away, and one that comes and goes.','Take a few slow breaths without trying to label every sound.','Walk back gently, carrying one sound with you in memory.'], notice:'Rhythm, distance, pauses, and sounds you usually tune out.', look_for:['A close-up sound','A sound in the distance','A sound that starts and stops','A moment of quiet between sounds'], route_summary:'Keep this route simple and close to a familiar starting point.', route_segments:['Begin in a safe spot away from traffic.','Move slowly along a familiar public path, if you wish.','Pause in a comfortable place to listen for a near and far sound.','Return to your starting point without rushing.'], screen_rule:'Keep the screen dark and let your ears do the work.', safety:'Stay aware of traffic and your surroundings. Do not close your eyes near roads.', reflection:'Which sound did you notice only after slowing down?', minutes:10 }
];

const checklistBase = [
  { id:'water', label:'Water, especially for a longer or warm walk', checked:false },
  { id:'footwear', label:'Comfortable shoes for the place I chose', checked:false },
  { id:'weather', label:'Sun or weather protection, as needed', checked:false },
  { id:'phone', label:'Charged phone and emergency contact', checked:false },
  { id:'route', label:'A familiar public path and a way back', checked:false },
  { id:'respect', label:'Leave nature as found; give wildlife space', checked:false }
];

function selectedValue(name) {
  return form.querySelector(`[name="${name}"]:checked`)?.value || form.elements[name]?.value || '';
}
function getInput() {
  return {
    minutes: Number(selectedValue('minutes')),
    mood: selectedValue('mood'),
    place: selectedValue('place'),
    company: form.elements.company.value,
    activity: form.elements.activity.value,
    location: form.elements.location.value.trim(),
    constraints: form.elements.constraints.value.trim()
  };
}
function setStatus({ ollama, installed, model }) {
  localAiStatus = Boolean(ollama && installed);
  statusDot.classList.toggle('ready', localAiStatus);
  statusLabel.textContent = localAiStatus ? `Local AI ready · ${model}` : ollama ? 'Ollama found · model missing' : 'Local mode · setup needed';
  statusLabel.title = localAiStatus ? 'The open-weight model is running on this device.' : 'WildMinute uses built-in plans when local AI is unavailable. Install Ollama and the model for AI-generated missions.';
}
async function checkStatus() {
  try { const res = await fetch('/api/status'); setStatus(await res.json()); }
  catch { setStatus({ ollama:false, installed:false, model:'Gemma 3 1B' }); }
}
function addText(parent, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}
function createNotice(parent, label, text, extra = '') {
  const box = document.createElement('div'); box.className = `notice-box ${extra}`.trim();
  addText(box, 'p', 'detail-label', label); addText(box, 'p', '', text); parent.append(box);
}
function invalidateJournal() {
  if (!currentAdventure?.journal) return;
  currentAdventure.journal = null;
  journalResultPanel.hidden = true;
  journalStatus.textContent = 'Your walk record changed. Generate the journal again to include the latest details.';
}
function createChecklist(input) {
  const items = checklistBase.map((item) => ({ ...item }));
  if (input.place === 'balcony') {
    items.find((item) => item.id === 'route').label = 'Choose a comfortable, safe spot and keep the exit clear';
    items.find((item) => item.id === 'footwear').label = 'Shoes or a stable seat, whichever suits the space';
  }
  if (input.activity === 'hiking' || input.place === 'trail') {
    items.find((item) => item.id === 'water').label = 'Enough water for the walk';
    items.find((item) => item.id === 'route').label = 'Check a reliable map, trail access and return route';
  }
  return items;
}
function ensureMissionFields(mission, input) {
  const base = fallbackMissions[0];
  const start = input.location ? `Start from a familiar, public spot in ${input.location}.` : 'Start from a familiar public entrance or doorstep.';
  const stationary = input.place === 'balcony';
  const routeSegments = Array.isArray(mission.route_segments) && mission.route_segments.length >= 3 ? mission.route_segments : stationary
    ? ['Choose a comfortable place on your balcony or doorstep.','Look around from where you are, without leaning over railings.','Notice a change in light, air or sound for a few minutes.','Finish by tidying your spot and heading back inside when ready.']
    : [start,'Follow a familiar, safe public path at an easy pace.','Pause at a comfortable spot and use your senses to notice a few details.','Turn back early enough to return the way you came.'];
  const lookFor = Array.isArray(mission.look_for) && mission.look_for.length ? mission.look_for : base.look_for;
  return {
    ...mission,
    route_summary: mission.route_summary || (stationary ? 'A stationary mini-adventure from a comfortable spot, with no route or distance required.' : 'A flexible out-and-back on a familiar public path, returning the same way.'),
    route_segments: routeSegments.slice(0, 5),
    look_for: lookFor.slice(0, 5),
    minutes: input.minutes
  };
}
function renderMission(mission, source) {
  mission = ensureMissionFields(mission, currentAdventure?.input || getInput());
  latestMission = mission;
  resultCard.replaceChildren();
  addText(resultCard, 'h3', 'mission-title', mission.title);
  addText(resultCard, 'p', 'mission-hook', mission.hook);
  addText(resultCard, 'p', 'mission-description', mission.mission);
  const grid = document.createElement('div'); grid.className = 'mission-detail-grid';
  const left = document.createElement('div'); addText(left, 'p', 'detail-label', 'YOUR LITTLE GAME PLAN');
  const list = document.createElement('ol'); list.className = 'steps-list';
  mission.steps.forEach((step, index) => { const li = document.createElement('li'); addText(li, 'span', '', String(index + 1).padStart(2, '0')); addText(li, 'div', '', step); list.append(li); }); left.append(list);
  const right = document.createElement('div'); addText(right, 'p', 'detail-label', 'KEEP AN EYE OUT');
  createNotice(right, 'A thing to notice', mission.notice);
  createNotice(right, 'Screen rule', mission.screen_rule, 'screen-rule');
  createNotice(right, 'Little safety check', mission.safety, 'safety-box');
  grid.append(left, right); resultCard.append(grid);

  document.querySelector('#routeSummary').textContent = mission.route_summary;
  const routeList = document.querySelector('#routeSegments'); routeList.replaceChildren();
  mission.route_segments.forEach((segment, i) => {
    const item = document.createElement('li');
    addText(item, 'span', 'route-number', String(i + 1).padStart(2, '0'));
    addText(item, 'p', '', segment); routeList.append(item);
  });
  const mapLink = document.querySelector('#mapSearchLink');
  if ((currentAdventure?.input?.location || '').trim()) {
    const location = currentAdventure.input.location.trim();
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location} public walking paths parks trails`)}`;
    mapLink.hidden = false;
    document.querySelector('#mapPrivacyNote').hidden = false;
  } else {
    mapLink.hidden = true;
    document.querySelector('#mapPrivacyNote').hidden = true;
  }
  const looking = document.querySelector('#lookForList'); looking.replaceChildren();
  mission.look_for.forEach((item) => {
    const li = document.createElement('li'); addText(li, 'span', 'spotting-mark', '✳'); addText(li, 'span', '', item); looking.append(li);
  });
  sourcePill.textContent = source === 'local-ai' ? `LOCAL AI · ${statusLabel.textContent.split('·').pop().trim()}` : 'BUILT-IN FALLBACK';
  sourcePill.classList.toggle('fallback', source !== 'local-ai');
  startButton.querySelector('span:first-child').textContent = 'Start my adventure';
  timerPanel.hidden = true; completionPanel.hidden = true; startButton.hidden = false; anotherButton.hidden = false;
  fieldNotesPanel.hidden = true; journalCapturePanel.hidden = true; journalResultPanel.hidden = true;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
function chooseFallback(input) {
  const index = (input.minutes + input.mood.length + input.place.length + input.company.length + input.activity.length) % fallbackMissions.length;
  const mission = structuredClone(fallbackMissions[index]);
  mission.minutes = input.minutes;
  if (input.minutes <= 5) {
    mission.steps = mission.steps.slice(0, 3);
    mission.mission = 'Take a five-minute pause outside and notice one detail you would usually miss.';
  } else if (input.minutes >= 20) mission.steps.push('Use any spare minutes to repeat the observation somewhere new.');
  if (input.constraints) mission.steps[0] += ` Keep this in mind: ${input.constraints}.`;
  if (input.mood === 'calm') { mission.title = 'A quieter kind of minute'; mission.hook = 'Nothing to achieve here. Just a little room to breathe.'; }
  if (input.mood === 'energised') { mission.title = 'Move, notice, repeat'; mission.hook = 'A little movement can make a familiar place feel new.'; }
  if (input.mood === 'connected') { mission.title = 'A small connection'; mission.hook = 'The world has more little connections than we tend to notice.'; }
  if (input.activity === 'birdwatching') { mission.title = 'The patient birdwatcher'; mission.notice = 'Look for movement, silhouettes or bird calls from a respectful distance, if any are around.'; mission.look_for = ['A bird-sized silhouette in the distance','A call or sound from above or nearby','A movement between branches or open spaces','A quiet place to pause without disturbing wildlife']; }
  if (input.activity === 'photowalk') { mission.title = 'Collect tiny compositions'; mission.notice = 'Notice a frame made from light, shadow, colour or texture before deciding whether to photograph it.'; mission.look_for = ['A frame within a frame','A small detail against a simple background','Light meeting shade','A texture or colour contrast']; }
  if (input.activity === 'hiking' || input.place === 'trail') {
    mission.safety = 'Use a marked, familiar public trail, check current local conditions separately, tell someone your plan and turn back if unsure.';
    mission.route_summary = 'Use a short, known out-and-back trail segment rather than attempting an unfamiliar route.';
    mission.route_segments = ['Begin at a known public trailhead or entrance.','Stay on the marked route you have verified locally.','Choose an obvious safe turnaround point that fits your time.','Return on the same known trail and keep your time buffer.'];
  }
  if (input.place === 'balcony') {
    mission.route_summary = 'A stationary mini-adventure from a comfortable spot. No route or distance is needed.';
    mission.route_segments = ['Choose a stable, comfortable spot on your balcony or doorstep.','Keep a safe distance from railings and edges.','Notice light, air, sound and the shape of nearby objects.','Finish by heading inside whenever you are ready.'];
  }
  if (input.location) mission.hook += ` Use your chosen area, ${input.location}, as context, and stay on familiar public paths.`;
  return ensureMissionFields(mission, input);
}

function formatDate(iso, options = { dateStyle:'medium', timeStyle:'short' }) {
  if (!iso) return 'Not recorded';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat(undefined, options).format(date);
}
function makeId() { return globalThis.crypto?.randomUUID?.() || `wildminute-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open('wildminute-fieldbook', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('adventures')) db.createObjectStore('adventures', { keyPath:'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local fieldbook'));
  });
  return dbPromise;
}
async function dbOperation(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('adventures', mode);
    const store = tx.objectStore('adventures');
    let request;
    try { request = action(store); } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error || request?.error);
    tx.onabort = () => reject(tx.error || new Error('Local storage transaction aborted'));
  });
}
async function putAdventure() {
  if (!currentAdventure) return;
  try {
    await dbOperation('readwrite', (store) => store.put(currentAdventure));
    localStorage.setItem('wildminute.activeId', currentAdventure.id);
  } catch (error) {
    // Keep a text-only emergency draft if IndexedDB is blocked; photos remain in the running session.
    try {
      const safeCopy = { ...currentAdventure, observations: currentAdventure.observations.map(({ photo, ...item }) => ({ ...item, photo: null, photoOmitted: Boolean(photo) })) };
      localStorage.setItem('wildminute.fallbackDraft', JSON.stringify(safeCopy));
      localStorage.setItem('wildminute.activeId', currentAdventure.id);
    } catch { /* Storage may be disabled; the current session still works in memory. */ }
  }
  renderSavedJournals();
}
async function getAdventure(id) {
  try { return await dbOperation('readonly', (store) => store.get(id)); }
  catch {
    try { const item = JSON.parse(localStorage.getItem('wildminute.fallbackDraft') || 'null'); return item?.id === id ? item : null; }
    catch { return null; }
  }
}
async function getAllAdventures() {
  try { return (await dbOperation('readonly', (store) => store.getAll())) || []; }
  catch {
    try { const item = JSON.parse(localStorage.getItem('wildminute.fallbackDraft') || 'null'); return item ? [item] : []; }
    catch { return []; }
  }
}

function renderChecklist() {
  if (!currentAdventure) return;
  const list = document.querySelector('#checklistItems'); list.replaceChildren();
  currentAdventure.checklist.forEach((item) => {
    const label = document.createElement('label'); label.className = `checklist-item${item.checked ? ' is-checked' : ''}`;
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = item.checked; input.setAttribute('aria-label', item.label);
    input.addEventListener('change', () => {
      item.checked = input.checked; label.classList.toggle('is-checked', item.checked); invalidateJournal(); updateChecklistProgress(); putAdventure();
    });
    label.append(input); addText(label, 'span', '', item.label); list.append(label);
  });
  updateChecklistProgress();
}
function updateChecklistProgress() {
  if (!currentAdventure) return;
  const checked = currentAdventure.checklist.filter((item) => item.checked).length;
  const total = currentAdventure.checklist.length;
  document.querySelector('#checklistProgress').textContent = `${checked} of ${total} ready`;
  document.querySelector('#checklistProgressBar').style.width = `${total ? checked / total * 100 : 0}%`;
}
function resetChecklist() {
  if (!currentAdventure) return;
  currentAdventure.checklist.forEach((item) => { item.checked = false; });
  invalidateJournal(); renderChecklist(); putAdventure();
}

document.querySelector('#resetChecklistButton').addEventListener('click', resetChecklist);
document.querySelector('#printChecklistButton').addEventListener('click', () => window.print());

function revokeObservationPhotoUrls() {
  renderedObservationUrls.forEach((url) => URL.revokeObjectURL(url)); renderedObservationUrls = [];
}
function revokeJournalPhotoUrls() {
  renderedJournalUrls.forEach((url) => URL.revokeObjectURL(url)); renderedJournalUrls = [];
}
function renderObservations() {
  revokeObservationPhotoUrls();
  observationsList.replaceChildren();
  const observations = currentAdventure?.observations || [];
  observationCount.textContent = observations.length ? `${observations.length} ${observations.length === 1 ? 'field note' : 'field notes'} saved on this device.` : 'Nothing recorded yet. A word or a photo is plenty.';
  observations.forEach((item) => {
    const card = document.createElement('article'); card.className = 'observation-card';
    if (item.photo instanceof Blob) {
      const img = document.createElement('img'); img.className = 'observation-photo'; img.alt = item.text ? `Photo: ${item.text.slice(0, 90)}` : 'Saved adventure photo';
      const url = URL.createObjectURL(item.photo); renderedObservationUrls.push(url); img.src = url; card.append(img);
    }
    const body = document.createElement('div'); body.className = 'observation-card-body';
    const kindLabels = { observation:'Observation', note:'Note / reflection', moment:'Favourite moment' };
    addText(body, 'div', 'observation-meta', `${kindLabels[item.kind] || 'Field note'} · ${formatDate(item.createdAt)}`);
    if (item.text) addText(body, 'p', 'observation-body', item.text);
    const remove = addText(body, 'button', 'text-button', 'Remove'); remove.type = 'button'; remove.addEventListener('click', async () => {
      currentAdventure.observations = currentAdventure.observations.filter((entry) => entry.id !== item.id);
      invalidateJournal(); await putAdventure(); renderObservations();
    });
    card.append(body); observationsList.append(card);
  });
}
async function compressPhoto(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  try {
    const bitmap = await createImageBitmap(file);
    const maxSize = 1440;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { alpha:false }); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
    if (blob) return blob;
  } catch { /* Fall back to storing the original image blob. */ }
  if (file.size > 8 * 1024 * 1024) throw new Error('This photo is too large to save locally. Please choose a smaller image.');
  return file;
}
function clearSelectedPhoto() {
  selectedPhotoBlob = null;
  observationPhoto.value = '';
  photoPreviewWrap.hidden = true;
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null; photoPreview.removeAttribute('src');
}
observationPhoto.addEventListener('change', async () => {
  const file = observationPhoto.files?.[0];
  if (!file) { clearSelectedPhoto(); return; }
  journalStatus.textContent = 'Preparing photo for local storage…';
  try {
    selectedPhotoBlob = await compressPhoto(file);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = URL.createObjectURL(selectedPhotoBlob); photoPreview.src = photoPreviewUrl; photoPreviewWrap.hidden = false;
    journalStatus.textContent = 'Photo ready. It will stay on this device.';
  } catch (error) { clearSelectedPhoto(); journalStatus.textContent = error.message; }
});
clearPhotoButton.addEventListener('click', clearSelectedPhoto);
observationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentAdventure) return;
  const text = observationText.value.trim();
  if (!text && !selectedPhotoBlob) { observationText.focus(); observationText.setCustomValidity('Add a short note or choose a photo.'); observationText.reportValidity(); setTimeout(() => observationText.setCustomValidity(''), 5); return; }
  const photo = selectedPhotoBlob;
  currentAdventure.observations.push({ id:makeId(), kind:observationKind.value, text, createdAt:new Date().toISOString(), photo:photo || null });
  invalidateJournal();
  observationText.value = ''; observationKind.value = 'observation'; clearSelectedPhoto();
  await putAdventure(); renderObservations();
});

function buildFallbackJournal() {
  const obs = currentAdventure?.observations || [];
  const checked = currentAdventure?.checklist.filter((item) => item.checked).length || 0;
  const total = currentAdventure?.checklist.length || 0;
  const location = currentAdventure?.input.location ? ` around ${currentAdventure.input.location}` : '';
  const activity = currentAdventure?.input.activity?.replace('-', ' ') || 'outdoor adventure';
  const title = obs.find((item) => item.text)?.text.split(/[.!?\n]/)[0].slice(0, 70) || currentAdventure?.mission.title || 'A little time outside';
  const sentences = [`Today I took ${currentAdventure?.input.minutes || 10} minutes for ${activity}${location}. ${currentAdventure?.mission.mission || 'I went outside to notice the world around me.'}`];
  if (obs.length) {
    const noteTexts = obs.filter((item) => item.text).slice(0, 3).map((item) => item.text);
    if (noteTexts.length) sentences.push(`I brought back these field notes: ${noteTexts.map((text) => `“${text}”`).join('; ')}.`);
    if (obs.some((item) => item.photo)) sentences.push(`I saved ${obs.filter((item) => item.photo).length} photo${obs.filter((item) => item.photo).length === 1 ? '' : 's'} to remember the moment.`);
  } else sentences.push('I kept the record simple, leaving room for the memory itself.');
  sentences.push(`My adventure checklist was ${checked} of ${total} items ready.`);
  if (journalReflection.value.trim()) sentences.push(journalReflection.value.trim());
  return {
    title,
    summary:sentences.join(' '),
    highlight:obs.find((item) => item.text)?.text || 'The best detail may be the one you remember without writing it down.',
    closing_question:currentAdventure?.mission.reflection || 'What would you like to notice next time?'
  };
}
async function generateJournal() {
  if (!currentAdventure) return;
  generateJournalButton.disabled = true;
  generateJournalButton.innerHTML = '<span class="loading-inline"><span class="spinner"></span> Gathering the little details…</span>';
  journalStatus.textContent = 'Trying local AI first. Your notes are sent only to the Ollama service on this device.';
  const payload = {
    mission:currentAdventure.mission,
    location:currentAdventure.input.location,
    activity:currentAdventure.input.activity,
    startedAt:currentAdventure.startedAt,
    returnedAt:currentAdventure.returnedAt,
    reflection:journalReflection.value.trim(),
    observations:currentAdventure.observations.map(({ kind, text, createdAt }) => ({ kind, text, createdAt })),
    checklist:currentAdventure.checklist.map(({ label, checked }) => ({ label, checked }))
  };
  let journal = null; let source = 'fallback';
  try {
    const response = await fetch('/api/journal', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Local AI was not available.');
    journal = result.journal; source = result.source || 'local-ai';
  } catch {
    journal = buildFallbackJournal();
  } finally {
    generateJournalButton.disabled = false;
    generateJournalButton.innerHTML = '<span>Generate my Adventure Journal</span><span class="button-arrow">✳</span>';
  }
  currentAdventure.journal = { ...journal, source, generatedAt:new Date().toISOString(), reflection:journalReflection.value.trim() };
  await putAdventure();
  renderJournal();
  journalStatus.textContent = source === 'local-ai' ? 'Journal written by your local model. No hosted AI service was used.' : 'Journal made with the on-device template. It also works offline.';
}
generateJournalButton.addEventListener('click', generateJournal);
journalReflection.addEventListener('input', invalidateJournal);

function renderJournal() {
  if (!currentAdventure?.journal) { journalResultPanel.hidden = true; return; }
  const journal = currentAdventure.journal;
  document.querySelector('#journalResultTitle').textContent = journal.title || currentAdventure.mission.title || 'My Adventure Journal';
  document.querySelector('#journalMeta').textContent = `${formatDate(currentAdventure.returnedAt || journal.generatedAt)} · ${currentAdventure.input.minutes} min · ${currentAdventure.observations.length} field note${currentAdventure.observations.length === 1 ? '' : 's'}${currentAdventure.input.location ? ` · ${currentAdventure.input.location}` : ''}`;
  document.querySelector('#journalSummary').textContent = journal.summary;
  const highlight = document.querySelector('#journalHighlight');
  highlight.textContent = journal.highlight || '';
  highlight.hidden = !journal.highlight;
  document.querySelector('#journalSource').textContent = journal.source === 'local-ai' ? 'LOCAL AI' : 'ON-DEVICE TEMPLATE';
  document.querySelector('#journalSource').classList.toggle('fallback', journal.source !== 'local-ai');
  const photoList = document.querySelector('#journalPhotos'); photoList.replaceChildren();
  revokeJournalPhotoUrls();
  currentAdventure.observations.filter((item) => item.photo instanceof Blob).slice(0, 8).forEach((item) => {
    const img = document.createElement('img'); img.alt = item.text ? item.text.slice(0, 100) : 'Adventure photo';
    const url = URL.createObjectURL(item.photo); renderedJournalUrls.push(url); img.src = url; photoList.append(img);
  });
  const observations = document.querySelector('#journalObservations'); observations.replaceChildren();
  const recorded = currentAdventure.observations.filter((item) => item.text);
  if (recorded.length) {
    addText(observations, 'h4', '', 'Field notes');
    recorded.forEach((item) => { const p = document.createElement('p'); addText(p, 'span', 'observation-kind-label', `${item.kind}: `); p.append(document.createTextNode(item.text)); observations.append(p); });
  }
  journalResultPanel.hidden = false;
  journalResultPanel.scrollIntoView({ behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
}
function journalAsText() {
  if (!currentAdventure?.journal) return '';
  const a = currentAdventure; const j = a.journal;
  const lines = [j.title || a.mission.title, formatDate(a.returnedAt || j.generatedAt), `${a.input.minutes} minutes · ${a.input.activity}${a.input.location ? ` · ${a.input.location}` : ''}`, '', j.summary, '', `Remember this: ${j.highlight || a.mission.reflection}`];
  if (a.observations.length) {
    lines.push('', 'FIELD NOTES');
    a.observations.forEach((item) => { lines.push(`- ${formatDate(item.createdAt, { dateStyle:'short', timeStyle:'short' })} [${item.kind}] ${item.text || (item.photo ? 'Photo saved in WildMinute' : '')}`); });
  }
  lines.push('', `Checklist: ${a.checklist.filter((item) => item.checked).length}/${a.checklist.length} ready`, '', 'Made with WildMinute · stored on this device.');
  return lines.join('\n');
}
document.querySelector('#downloadJournalButton').addEventListener('click', () => {
  const text = journalAsText(); if (!text) return;
  const blob = new Blob([text], { type:'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `wildminute-journal-${new Date().toISOString().slice(0,10)}.txt`; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
});
document.querySelector('#shareJournalButton').addEventListener('click', async () => {
  const text = journalAsText(); if (!text) return;
  if (navigator.share) {
    try { await navigator.share({ title:currentAdventure.journal.title || 'My WildMinute Adventure', text }); journalStatus.textContent = 'Journal shared.'; return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); journalStatus.textContent = 'Journal copied to clipboard.'; }
  catch { journalStatus.textContent = 'Use “Save journal as text” to keep a copy.'; }
});

async function renderSavedJournals() {
  const all = await getAllAdventures();
  const journals = all.filter((item) => item.journal).sort((a, b) => (b.returnedAt || b.createdAt || '').localeCompare(a.returnedAt || a.createdAt || ''));
  savedJournalsSection.hidden = journals.length === 0;
  savedJournalsList.replaceChildren();
  journals.slice(0, 10).forEach((item) => {
    const card = document.createElement('article'); card.className = 'saved-journal-card';
    const copy = document.createElement('div');
    addText(copy, 'p', 'saved-journal-date', formatDate(item.returnedAt || item.createdAt, { dateStyle:'medium' }));
    addText(copy, 'h3', '', item.journal.title || item.mission.title || 'A little adventure');
    addText(copy, 'p', 'saved-journal-description', item.journal.summary);
    const button = addText(card, 'button', 'quiet-button', 'Open journal ↗'); button.type = 'button'; button.addEventListener('click', () => openSavedJournal(item.id));
    card.append(copy, button); savedJournalsList.append(card);
  });
}
async function openSavedJournal(id) {
  const saved = await getAdventure(id); if (!saved) return;
  currentAdventure = saved; localStorage.setItem('wildminute.activeId', id);
  renderMission(saved.mission, saved.source || 'fallback');
  renderChecklist(); renderObservations();
  startButton.hidden = true; anotherButton.hidden = true;
  completionPanel.hidden = false; reflectionText.textContent = saved.mission.reflection || 'What stayed with you?';
  fieldNotesPanel.hidden = false; journalCapturePanel.hidden = false; timerPanel.hidden = true;
  journalReflection.value = saved.journal?.reflection || '';
  renderJournal();
}

function stopTimer() { if (timerInterval) clearInterval(timerInterval); timerInterval = null; }
function paintTimer() {
  const min = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const sec = (remainingSeconds % 60).toString().padStart(2, '0'); timerDisplay.textContent = `${min}:${sec}`;
}
function startTicking() {
  stopTimer(); paused = false; pauseButton.textContent = 'Pause timer';
  timerInterval = setInterval(() => {
    if (paused) return;
    if (remainingSeconds > 0) { remainingSeconds -= 1; paintTimer(); }
    else { stopTimer(); timerCopy.textContent = 'Your time is up. Come back whenever you are ready.'; pauseButton.textContent = 'Timer complete'; }
  }, 1000);
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = getInput();
  generateButton.disabled = true;
  generateButton.innerHTML = '<span class="loading-inline"><span class="spinner"></span> Planning your little adventure…</span><span class="button-arrow">↗</span>';
  let mission; let source = 'fallback';
  try {
    const response = await fetch('/api/mission', { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify(input) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Local AI is unavailable');
    mission = payload.mission; source = payload.source;
  } catch { mission = chooseFallback(input); }
  finally {
    generateButton.disabled = false;
    generateButton.innerHTML = '<span>Find my outside moment</span><span class="button-arrow">↗</span>';
  }
  currentAdventure = {
    id:makeId(), createdAt:new Date().toISOString(), startedAt:null, returnedAt:null,
    input, mission:ensureMissionFields(mission, input), source,
    checklist:createChecklist(input), observations:[], journal:null
  };
  latestMission = currentAdventure.mission;
  await putAdventure();
  renderMission(latestMission, source); renderChecklist(); renderObservations();
});

startButton.addEventListener('click', async () => {
  if (!latestMission || !currentAdventure) return;
  currentAdventure.startedAt = currentAdventure.startedAt || new Date().toISOString();
  await putAdventure();
  remainingSeconds = Math.max(60, Number(latestMission.minutes || 10) * 60); paintTimer();
  startButton.hidden = true; anotherButton.hidden = true; timerPanel.hidden = false; completionPanel.hidden = true;
  fieldNotesPanel.hidden = false; journalCapturePanel.hidden = true; journalResultPanel.hidden = true;
  timerCopy.textContent = 'Adventure started. Pocket the phone and go notice something.';
  renderObservations(); startTicking(); timerPanel.scrollIntoView({ behavior:'smooth', block:'center' });
});
pauseButton.addEventListener('click', () => {
  if (remainingSeconds <= 0) { pauseButton.textContent = 'Timer complete'; return; }
  paused = !paused; pauseButton.textContent = paused ? 'Resume timer' : 'Pause timer';
});
finishButton.addEventListener('click', async () => {
  stopTimer();
  currentAdventure.returnedAt = new Date().toISOString();
  await putAdventure();
  timerPanel.hidden = true; completionPanel.hidden = false;
  reflectionText.textContent = latestMission?.reflection || 'What did you notice when you slowed down?';
  fieldNotesPanel.hidden = false; journalCapturePanel.hidden = false; journalResultPanel.hidden = true;
  renderObservations(); journalCapturePanel.scrollIntoView({ behavior:'smooth', block:'start' });
});
anotherButton.addEventListener('click', () => form.requestSubmit());
resetButton.addEventListener('click', () => {
  resultSection.hidden = true; currentAdventure = null; latestMission = null;
  localStorage.removeItem('wildminute.activeId');
  form.scrollIntoView({ behavior:'smooth', block:'start' }); document.querySelector('#planner-title').focus?.();
});

async function resumeActiveAdventure() {
  const id = localStorage.getItem('wildminute.activeId'); if (!id) return;
  const saved = await getAdventure(id); if (!saved?.mission || !saved?.input) return;
  currentAdventure = saved;
  // Restore preferences without overriding any stored personal notes.
  if (saved.input.location) form.elements.location.value = saved.input.location;
  if (saved.input.activity) form.elements.activity.value = saved.input.activity;
  if (saved.input.constraints) form.elements.constraints.value = saved.input.constraints;
  if (saved.input.company) form.elements.company.value = saved.input.company;
  const mood = form.querySelector(`[name="mood"][value="${saved.input.mood}"]`); if (mood) mood.checked = true;
  const place = form.querySelector(`[name="place"][value="${saved.input.place}"]`); if (place) place.checked = true;
  const minutes = form.querySelector(`[name="minutes"][value="${saved.input.minutes}"]`); if (minutes) minutes.checked = true;
  renderMission(saved.mission, saved.source || 'fallback'); renderChecklist(); renderObservations();
  if (saved.returnedAt) {
    startButton.hidden = true; anotherButton.hidden = true; completionPanel.hidden = false;
    reflectionText.textContent = saved.mission.reflection || 'What stayed with you?';
    fieldNotesPanel.hidden = false; journalCapturePanel.hidden = false; journalReflection.value = saved.journal?.reflection || '';
    if (saved.journal) renderJournal();
  } else if (saved.startedAt) {
    startButton.hidden = true; anotherButton.hidden = true; timerPanel.hidden = false; fieldNotesPanel.hidden = false;
    remainingSeconds = Number(saved.input.minutes || 10) * 60; paintTimer(); paused = true; pauseButton.textContent = 'Resume timer';
    timerCopy.textContent = 'Your adventure is saved. The timer paused while this page was closed.';
  }
}

checkStatus();
renderSavedJournals();
resumeActiveAdventure();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
