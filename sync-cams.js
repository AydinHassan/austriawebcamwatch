import fs from 'fs';
import https from 'https';
import path from 'path';

// Fetch data from the API
https.get('https://api.panomax.com/1.0/instances/lists', (response) => {
  let data = '';

  // Collect the data
  response.on('data', chunk => {
    data += chunk;
  });

  response.on('end', () => {
    try {
      // console.log(data);
      // return;
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

      const outputPath = path.resolve(process.cwd(), 'src/assets/austria-cams.json');

      // Save the result to a new file
      fs.writeFileSync(outputPath, JSON.stringify(austriaCams, null, 2));
      console.log('Austria cams data has been saved to austria-cams.json');
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  });

}).on('error', (err) => {
  console.log('Request failed', err);
});
