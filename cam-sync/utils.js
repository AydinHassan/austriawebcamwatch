import fs from 'fs';
// Dedupe URLs (first occurrence wins) and assign stable name suffixes for
// duplicate names. Pass `existingNameByUrl` to preserve names from a prior
// run so unchanged cams never get renumbered just because scrape order shifted.
// For new cams (URL not in the map), suffixes are assigned in URL-sorted order
// so a fresh run is also deterministic.
export function dedupeUrls(cams) {
  const seen = new Set();
  return cams.filter(cam => {
    if (seen.has(cam.url)) return false;
    seen.add(cam.url);
    return true;
  });
}

export function dedupeNamesAndSort(cams, existingNameByUrl = {}) {
  const sorted = [...cams].sort((a, b) => a.url.localeCompare(b.url));

  const taken = new Set();
  const out = Array.from({ length: sorted.length });
  const unassigned = [];

  sorted.forEach((cam, i) => {
    const existing = existingNameByUrl[cam.url];
    if (existing && !taken.has(existing)) {
      out[i] = { ...cam, name: existing };
      taken.add(existing);
    } else {
      unassigned.push(i);
    }
  });

  for (const i of unassigned) {
    const cam = sorted[i];
    const base = cam.name;
    let chosen = base;
    if (taken.has(chosen)) {
      let n = 2;
      while (taken.has(`${base} ${n}`)) n++;
      chosen = `${base} ${n}`;
    }
    out[i] = { ...cam, name: chosen };
    taken.add(chosen);
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const overrides = JSON.parse(
  fs.readFileSync(new URL('./bergfex-overrides.json', import.meta.url), 'utf-8'),
);

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

function distanceMetres(a, b) {
  const rad = deg => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function nameWords(name) {
  return new Set(
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 3),
  );
}

function nameSimilarity(a, b) {
  const wa = nameWords(a);
  const wb = nameWords(b);
  const shared = [...wa].filter(w => wb.has(w)).length;
  return shared / Math.max(1, Math.min(wa.size, wb.size));
}

// Bergfex re-publishes cams from other providers, copying their coordinates
// exactly. Drop those copies in favour of the direct cams, and remember the
// Bergfex name as an alias so presets that use it keep working.
// Only cams on the identical point count (nearby ones are separate cams), and
// matching is one-to-one by best name. Where that cannot tell, a person decided:
// see bergfex-overrides.json.
export function removeBergfexCopies(bergfexCams, directCams, maxDistance = 1, reviewDistance = 25) {
  const pairs = [];
  for (const b of bergfexCams) {
    if (b.latitude == null || b.longitude == null) continue;
    for (const d of directCams) {
      const distance = distanceMetres(b, d);
      if (distance <= reviewDistance) {
        pairs.push({ b, d, distance, score: nameSimilarity(b.name, d.name) });
      }
    }
  }
  pairs.sort((x, y) => y.score - x.score || x.distance - y.distance);

  const replaced = new Map();
  const usedDirect = new Set();
  // Copies on the identical point, one per direct cam, unless a person said otherwise
  for (const { b, d, distance } of pairs) {
    if (distance > maxDistance || replaced.has(b) || usedDirect.has(d)) continue;
    if (overrides.different.includes(b.name)) continue;
    replaced.set(b, d);
    usedDirect.add(d);
  }
  // Copies a person confirmed, including extra ones and slightly moved ones
  for (const { b, d } of [...pairs].sort((x, y) => x.distance - y.distance)) {
    if (!replaced.has(b) && overrides.same.includes(b.name)) replaced.set(b, d);
  }

  const direct = directCams.map(cam => {
    const copies = [...replaced].filter(([, d]) => d === cam).map(([b]) => b.name);
    return copies.length ? { ...cam, aliases: [...new Set([...(cam.aliases ?? []), ...copies])] } : cam;
  });

  const unconfirmed = [...replaced.keys()].filter(b => !overrides.same.includes(b.name)).length;
  console.log(`[merge] Dropped ${replaced.size} Bergfex copies of direct cams (${replaced.size - unconfirmed} confirmed by review)`);
  return { bergfex: bergfexCams.filter(b => !replaced.has(b)), direct };
}

// Keep aliases from the previous sync, since the Bergfex copies they came
// from are no longer around to be matched again
export function carryOverAliases(cams, existing) {
  const aliasesByUrl = Object.fromEntries(existing.filter(c => c.aliases).map(c => [c.url, c.aliases]));
  return cams.map(cam => {
    const previous = aliasesByUrl[cam.url];
    return previous ? { ...cam, aliases: [...new Set([...previous, ...(cam.aliases ?? [])])] } : cam;
  });
}
