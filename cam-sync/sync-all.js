import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fetchWithRetries, Throttle } from './utils.js';

const bergfexThrottle = new Throttle(3000);

const __dirname = import.meta.dirname;
const outputPath = path.resolve(__dirname, '..', 'src', 'assets', 'austria-cams.json');

const maxBergfexCams = parseInt(process.env.MAX_BERGFEX_CAMS || '0', 10) || Infinity;

// --- Panomax ---

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

// --- Bergfex ---

async function fetchBergfexCamLinks() {
  console.log('[bergfex] Fetching area list...');
  const html = await fetchWithRetries('https://www.bergfex.at/sommer/oesterreich/webcams/');
  const $ = cheerio.load(html);

  const areas = [];
  $('div.list-webcams li a').each((_, elem) => {
    areas.push({
      link: $(elem).attr('href'),
      title: $(elem).text(),
    });
  });

  console.log(`[bergfex] Found ${areas.length} areas`);

  const areasToProcess = maxBergfexCams === Infinity ? areas : areas.slice(0, maxBergfexCams);
  const allLinks = [];
  let notFoundCount = 0;
  let failedCount = 0;
  const maxFailureRate = 0.05;

  for (let i = 0; i < areasToProcess.length; i++) {
    const { link, title } = areasToProcess[i];
    console.log(`[bergfex] Processing area ${i + 1}/${areasToProcess.length}: ${title}`);
    const areaUrl = 'https://www.bergfex.at/' + link.replace(/^\//, '');
    try {
      const areaPage = await fetchWithRetries(areaUrl, { throttle: bergfexThrottle });
      const $area = cheerio.load(areaPage);

      $area('a[data-tracking-event="webcam-overview_entry_click"]').each((_, elem) => {
        allLinks.push($area(elem).attr('href'));
      });
    } catch (error) {
      if (error.status === 404) {
        console.log(`[bergfex] 404 for area ${title}, skipping`);
        notFoundCount++;
        continue;
      }
      failedCount++;
      const failureRate = failedCount / areasToProcess.length;
      console.log(`[bergfex] Error for area ${title}: ${error.message} (failures: ${failedCount})`);
      if (failureRate > maxFailureRate) {
        throw new Error(`Aborting: failure rate ${(failureRate * 100).toFixed(1)}% exceeds ${maxFailureRate * 100}% threshold (${failedCount} failures out of ${areasToProcess.length} areas)`);
      }
      continue;
    }

    await bergfexThrottle.wait();
  }

  console.log(`[bergfex] Found ${allLinks.length} camera links (${notFoundCount} 404s, ${failedCount} failures)`);
  return allLinks;
}

async function fetchBergfexCams(camLinks) {
  const limit = Math.min(camLinks.length, maxBergfexCams);
  console.log(`[bergfex] Fetching details for ${limit} cameras...`);

  const cams = [];
  let notFoundCount = 0;
  let failedCount = 0;
  const maxFailureRate = 0.05;

  for (let i = 0; i < limit; i++) {
    console.log(`[bergfex] Processing camera ${i + 1}/${limit}`);
    const url = camLinks[i];
    try {
      const html = await fetchWithRetries('https://www.bergfex.at' + url, { throttle: bergfexThrottle });
      const $ = cheerio.load(html);

      const metaTag = $('meta[name="geoposition"]');
      let lat = null;
      let long = null;

      if (metaTag.length) {
        const content = metaTag.attr('content');
        [lat, long] = content.split(',').map(parseFloat);
      }

      const name = $('h1.tw-text-4xl span').eq(1).text();
      const iframeSrc = $('iframe').attr('src');

      if (name && iframeSrc) {
        cams.push({
          name,
          url: iframeSrc,
          provider: 'bergfex',
          latitude: lat,
          longitude: long,
        });
      }
    } catch (error) {
      if (error.status === 404) {
        console.log(`[bergfex] 404 for ${url}, skipping`);
        notFoundCount++;
        continue;
      }
      failedCount++;
      const failureRate = failedCount / limit;
      console.log(`[bergfex] Error for ${url}: ${error.message} (failures: ${failedCount})`);
      if (failureRate > maxFailureRate) {
        throw new Error(`Aborting: failure rate ${(failureRate * 100).toFixed(1)}% exceeds ${maxFailureRate * 100}% threshold (${failedCount} failures out of ${limit} cameras)`);
      }
      continue;
    }

    await bergfexThrottle.wait();
  }

  console.log(`[bergfex] Fetched ${cams.length} cameras (${notFoundCount} 404s, ${failedCount} failures)`);
  return cams;
}

// --- Merge & Dedupe ---

function dedupeUrls(cams) {
  const seen = new Set();
  return cams.filter(cam => {
    if (seen.has(cam.url)) return false;
    seen.add(cam.url);
    return true;
  });
}

function dedupeNamesAndSort(cams) {
  const counts = {};
  cams.forEach(cam => {
    const name = cam.name;
    if (counts[name]) {
      counts[name]++;
      cam.name = `${name} ${counts[name]}`;
    } else {
      counts[name] = 1;
    }
  });

  return cams.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Main ---

async function main() {
  const panomaxCams = await fetchPanomaxCams();
  const bergfexLinks = await fetchBergfexCamLinks();
  const bergfexCams = await fetchBergfexCams(bergfexLinks);

  let allCams = [...panomaxCams, ...bergfexCams];
  console.log(`[merge] Total before dedupe: ${allCams.length}`);

  allCams = dedupeUrls(allCams);
  console.log(`[merge] After URL dedupe: ${allCams.length}`);

  allCams = dedupeNamesAndSort(allCams);
  console.log(`[merge] After name dedupe & sort: ${allCams.length}`);

  fs.writeFileSync(outputPath, JSON.stringify(allCams, null, 2));
  console.log(`[done] Wrote ${allCams.length} cameras to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
