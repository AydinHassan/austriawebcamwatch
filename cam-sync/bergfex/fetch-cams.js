import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fetchWithRetries } from '../utils.js'


const stateFilePath = path.resolve(__dirname, 'sync-state.json');
const webcamDataPath = path.resolve(__dirname, 'cams.json');

let state = { lastProcessedIndex: 0 };

if (fs.existsSync(stateFilePath)) {
  const savedState = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
  state = savedState;
}

// Read the list of webcam links
const webcamLinks = JSON.parse(fs.readFileSync('cam-links.json', 'utf-8'));

// Delay function to wait between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processWebcams = async () => {
  const maxProcess = Math.min(state.lastProcessedIndex + 50, webcamLinks.length);

  for (let i = state.lastProcessedIndex; i < maxProcess; i++) {
    console.log('Processing link ', i, ' of ', webcamLinks.length);
    const url = webcamLinks[i];
    try {
      const html = await fetchWithRetries('https://www.bergfex.at' + url);

      state.lastProcessedIndex++;

      const $ = cheerio.load(html);

      const metaTag = $('meta[name="geoposition"]');
      let lat = null;
      let long = null;

      if (metaTag.length) {
        const content = metaTag.attr("content");
        [lat, long] = content.split(",").map(parseFloat);
      }

      const webcams = {
        "name": $('h1.tw-text-4xl span').eq(1).text(),
        "url": $('iframe').attr('src'),
        "provider": "bergfex",
        "latitude": lat,
        "longitude": long
      };
      //
      appendToFile(webcamDataPath, webcams)
      fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
    } catch (error) {
      if (error.status === 404) {
        state.lastProcessedIndex++;
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));

        continue;
      }
    }
    // Wait for a random time between 2 and 3 seconds
    const randomDelay = Math.random() * 2000 + 1000;
    await delay(randomDelay);
  }

  console.log('Processing complete!');
};

const appendToFile = (filePath, item) => {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.push(item);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } else {
    fs.writeFileSync(filePath, JSON.stringify([item], null, 2));
  }
};


processWebcams().catch(err => console.error(err));
