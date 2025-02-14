## Panomax

```shell
cd panomax
node fetch-cams.js
cp cams.json ../../src/assets/austria-cams.json
```

## Bergfex

First fetch all group page links

```shell
cd bergfex
node fetch-cam-link.js
```

Then fetch all cam data. It will run in batches of 50 and record last position so it can be run multiple times until it finishes.

```shell
cd bergfex
node fetch-cams.js
```

Then deduplicate the names, a bunch of cams have the same name, so we append 1,2, etc

```shell
node dedupe.js bergfex/cams.json
```

Then merge it with the panomax ones

```shell
node merge.js ../src/assets/austria-cams.json bergfex/webcams.json
```