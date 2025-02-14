export async function fetchWithRetries(url, maxRetries = 5) {
  const delays = [1000, 2000, 5000, 10000, 20000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await fetch(url);

      if (response.status === 404) {
        const error = new Error(`404 Not Found: ${url}`);
        error.status = 404;
        throw error;
      }

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.text();
    } catch (error) {
      if (error.status === 404) {
        console.error(`Attempt ${attempt + 1} failed. 404 not retrying`);
        throw error;
      }

      console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts, error: ${error.message}`);
      }
    }
  }
}
