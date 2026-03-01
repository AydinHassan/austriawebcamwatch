export async function fetchWithRetries(url, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await fetch(url);

      if (response.status === 404) {
        const error = new Error(`404 Not Found: ${url}`);
        error.status = 404;
        throw error;
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.min(2000 * Math.pow(2, attempt), 60000);
        console.error(`Attempt ${attempt + 1} failed: 429 rate limited, waiting ${Math.round(delay / 1000)}s`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        const error = new Error(`Rate limited after ${maxRetries} attempts: ${url}`);
        error.status = 429;
        throw error;
      }

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.text();
    } catch (error) {
      if (error.status === 404 || error.status === 429) {
        throw error;
      }

      console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
      if (attempt < maxRetries - 1) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        const err = new Error(`Failed to fetch ${url} after ${maxRetries} attempts, error: ${error.message}`);
        err.status = 0;
        throw err;
      }
    }
  }
}
