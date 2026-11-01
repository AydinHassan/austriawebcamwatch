import { fetchWithRetries } from './utils.js';

// foto-webcam.eu has no public list API, but its homepage embeds the full
// cam list (with coordinates) as JSON.
export async function fetchFotoWebcamCams() {
  console.log('[foto-webcam] Fetching camera list...');
  const html = await fetchWithRetries('https://www.foto-webcam.eu/');
  const start = html.indexOf('[{"id":');
  if (start === -1) throw new Error('foto-webcam cam list not found on homepage');

  const cams = parseJsonArray(html.slice(start))
    .filter(cam => cam.country === 'at' && !cam.hidden && cam.latitude && cam.longitude)
    .map(cam => ({
      name: cam.name,
      url: cam.link,
      provider: 'foto-webcam',
      latitude: cam.latitude,
      longitude: cam.longitude,
      // Used by the in-app viewer to build image URLs
      fotoWebcamId: cam.id,
      captureInterval: cam.captureInterval || 600,
    }));

  console.log(`[foto-webcam] Found ${cams.length} Austrian cameras`);
  return cams;
}

// Parse the JSON array at the start of `text`, ignoring whatever follows it
function parseJsonArray(text) {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(0, i + 1));
    }
  }
  throw new Error('Unterminated JSON array');
}
