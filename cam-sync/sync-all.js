import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fetchWithRetries } from './utils.js';

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

  const allLinks = [];
  for (const { link, title } of areas) {
    console.log(`[bergfex] Processing area: ${title}`);
    const areaPage = await fetchWithRetries('https://www.bergfex.at/' + link);
    const $area = cheerio.load(areaPage);

    $area('a[data-tracking-event="webcam-overview-click"]').each((_, elem) => {
      allLinks.push($area(elem).attr('href'));
    });
  }

  console.log(`[bergfex] Found ${allLinks.length} camera links`);
  return allLinks;
}

async function fetchBergfexCams(camLinks) {
  const limit = Math.min(camLinks.length, maxBergfexCams);
  console.log(`[bergfex] Fetching details for ${limit} cameras...`);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const cams = [];

  for (let i = 0; i < limit; i++) {
    console.log(`[bergfex] Processing camera ${i + 1} of ${limit}`);
    const url = camLinks[i];
    try {
      const html = await fetchWithRetries('https://www.bergfex.at' + url);
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
        continue;
      }
      throw error;
    }

    const randomDelay = Math.random() * 2000 + 1000;
    await delay(randomDelay);
  }

  console.log(`[bergfex] Fetched ${cams.length} cameras`);
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
