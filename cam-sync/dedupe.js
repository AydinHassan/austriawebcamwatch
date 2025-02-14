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

const counts = {};
data.forEach(webcam => {
  const name = webcam.name;
  if (counts[name]) {
    counts[name]++;
    webcam.name = `${name} ${counts[name]}`;
  } else {
    counts[name] = 1;
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
