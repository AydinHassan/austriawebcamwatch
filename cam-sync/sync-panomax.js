import fs from 'fs';
import path from 'path';
import { fetchWithRetries, dedupeUrls, dedupeNamesAndSort } from './utils.js';

const __dirname = import.meta.dirname;
const outputPath = path.resolve(__dirname, '..', 'src', 'assets', 'austria-cams.json');

async function fetchPanomaxCams() {
  console.log('[panomax] Fetching camera list...');
  const data = await fetchWithRetries('https://api.panomax.com/1.0/instances/lists');
  const camsData = JSON.parse(data.trim());

  const cams = camsData.instances
    .filter(cam => cam.cam.country === 'at')
    .map(cam => ({
      name: cam.cam.name,
      url: cam.publicUrl,
      provider: 'panomax',
      latitude: cam.cam.latitude,
      longitude: cam.cam.longitude,
    }));

  console.log(`[panomax] Found ${cams.length} Austrian cameras`);
  return cams;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
  const existingBergfex = existing.filter(c => c.provider === 'bergfex');
  const existingNameByUrl = Object.fromEntries(existing.map(c => [c.url, c.name]));
  console.log(`[merge] Keeping ${existingBergfex.length} existing bergfex cameras`);

  const panomaxCams = await fetchPanomaxCams();

  let allCams = [...panomaxCams, ...existingBergfex];
  console.log(`[merge] Total before dedupe: ${allCams.length}`);

  allCams = dedupeUrls(allCams);
  console.log(`[merge] After URL dedupe: ${allCams.length}`);

  allCams = dedupeNamesAndSort(allCams, existingNameByUrl);
  console.log(`[merge] After name dedupe & sort: ${allCams.length}`);

  fs.writeFileSync(outputPath, JSON.stringify(allCams, null, 2));
  console.log(`[done] Wrote ${allCams.length} cameras to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
