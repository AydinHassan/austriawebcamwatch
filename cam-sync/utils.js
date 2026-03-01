export class Throttle {
  constructor(baseDelay = 3000) {
    this.baseDelay = baseDelay;
    this.currentDelay = baseDelay;
    this.maxDelay = 30000;
  }

  onSuccess() {
    // Slowly reduce delay back toward base on success
    this.currentDelay = Math.max(this.baseDelay, this.currentDelay * 0.9);
  }

  onRateLimit() {
    // Double delay on rate limit
    this.currentDelay = Math.min(this.currentDelay * 2, this.maxDelay);
    console.log(`[throttle] Increasing delay to ${Math.round(this.currentDelay / 1000)}s`);
  }

  async wait() {
    const jitter = Math.random() * this.currentDelay * 0.5;
    await new Promise(resolve => setTimeout(resolve, this.currentDelay + jitter));
  }
}

export async function fetchWithRetries(url, { maxRetries = 5, throttle } = {}) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });

      if (response.status === 404) {
        const error = new Error(`404 Not Found: ${url}`);
        error.status = 404;
        throw error;
      }

      if (response.status === 429) {
        if (throttle) throttle.onRateLimit();
        const delay = Math.min(2000 * Math.pow(2, attempt), 60000);
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
      if (throttle) throttle.onSuccess();
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
