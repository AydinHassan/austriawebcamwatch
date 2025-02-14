import fs from 'fs';
import path from 'path';

import { fetchWithRetries } from '../utils.js'


const data = await fetchWithRetries('https://api.panomax.com/1.0/instances/lists');

try {
  const camsData = JSON.parse(data.trim());

  const austriaCams = camsData.instances
    .filter(cam => cam.cam.country === 'at') // Filter for Austria
    .map(cam => ({
      name: cam.cam.name,
      url: cam.publicUrl,
      provider: 'panomax',
      latitude: cam.cam.latitude,
      longitude: cam.cam.longitude,
    }));

  const outputPath = path.resolve(__dirname, 'cams.json');

  // Save the result to a new file
  fs.writeFileSync(outputPath, JSON.stringify(austriaCams, null, 2));
  console.log('Austria cams data has been saved to austria-cams.json');
} catch (error) {
  console.error('Error parsing data:', error);
}
