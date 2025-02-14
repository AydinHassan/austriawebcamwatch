import fs from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node script.js <filename>');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(`Error: File "${file}" not found.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const seenUrls = new Set();
const filteredData = data.filter(webcam => {
  if (seenUrls.has(webcam.url)) {
    return false; // Skip this webcam because the URL is a duplicate
  } else {
    seenUrls.add(webcam.url); // Add the URL to the set of seen URLs
    return true; // Keep this webcam in the list
  }
});

fs.writeFileSync(file, JSON.stringify(filteredData, null, 2));
