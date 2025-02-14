import fs from 'fs';
import path from 'path';

const appendJsonFiles = async (file1, file2) => {
  try {
    // Check if both files exist
    if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
      console.error('One or both files do not exist.');
      return;
    }

    // Read and parse the files
    const data1 = JSON.parse(await fs.promises.readFile(file1, 'utf-8'));
    const data2 = JSON.parse(await fs.promises.readFile(file2, 'utf-8'));

    // Append the second file's data to the first
    const updatedData = [...data1, ...data2];

    // Write the updated data back to the first file
    await fs.promises.writeFile(file1, JSON.stringify(updatedData, null, 2));
    console.log('Files merged successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

const [,, file1, file2] = process.argv;

// Ensure both files are provided
if (!file1 || !file2) {
  console.error('Please provide two file names as arguments.');
  process.exit(1);
}

// Resolve to absolute paths
const filePath1 = path.resolve(file1);
const filePath2 = path.resolve(file2);

// Call the function
appendJsonFiles(filePath1, filePath2);
