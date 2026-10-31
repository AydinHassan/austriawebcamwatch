# Webcam Sync

Fetches webcams from Panomax, foto-webcam.eu and Bergfex, merges and deduplicates them (dropping Bergfex copies of Panomax and foto-webcam cams), and writes the result to `src/assets/austria-cams.json`.

## Usage

```shell
npm run sync
```

Or directly:

```shell
node cam-sync/sync-all.js
```

Set `MAX_BERGFEX_CAMS` to limit the number of Bergfex cams fetched (useful for testing):

```shell
MAX_BERGFEX_CAMS=10 npm run sync
```

## Automation

A GitHub Actions workflow runs this on the 1st of each month and opens a PR with any changes. It can also be triggered manually from the Actions tab.
