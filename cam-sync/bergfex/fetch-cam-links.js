import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fetchWithRetries } from '../utils.js'

const __dirname = import.meta.dirname;

function extractAllAreas(htmlContent) {
  try {
    const $ = cheerio.load(htmlContent);

    const results = [];

    $('div.list-webcams li a').each((_, elem) => {
      const link = $(elem).attr('href') || null;
      const title = $(elem).text() || null;

      results.push({ link, title });
    });

    return results;
  } catch (error) {
    console.error('Error parsing HTML content:', error);
  }
}

function extractCams(htmlContent) {
  try {
    const $ = cheerio.load(htmlContent);

    const results = [];

    $('a[data-tracking-event="webcam-overview-click"]').each((_, elem) => {
      const link = $(elem).attr('href') || null;
      results.push(link);
    });

    return results;
  } catch (error) {
    console.error('Error parsing HTML content:', error);
    return [];
  }
}

const htmlContent = await fetchWithRetries('https://www.bergfex.at/sommer/oesterreich/webcams/');

const areas = extractAllAreas(htmlContent);

console.log('Found a total of ', areas.length, ' areas');

const allLinks = [];

for (const { link, title } of areas) {
  console.log('Processing area: ', title);
  const areaPage = await fetchWithRetries('https://www.bergfex.at/' + link);
  const cams = extractCams(areaPage);
  console.log('Found a total of ', cams.length, ' cams in area');
  cams.forEach((camLink) => {
     allLinks.push(camLink);
  });
}


function saveLinksToFile(links) {
  const filename = path.resolve(__dirname, 'cam-links.json');
  try {
    fs.writeFileSync(filename, JSON.stringify(links, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving links to file:', error);
  }
}

console.log('Writing: ', allLinks.length, ' cam links to cam-links.json');

saveLinksToFile(allLinks);


