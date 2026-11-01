import { fetchWithRetries } from './utils.js';

// The JSON behind foto-webcam.eu's cam list. Undocumented, so it may change.
const CAMS_URL = 'https://www.foto-webcam.eu/webcam/include/metadata.php';

export async function fetchFotoWebcamCams() {
  console.log('[foto-webcam] Fetching camera list...');
  const { cams: allCams } = JSON.parse(await fetchWithRetries(CAMS_URL));

  const cams = allCams
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
