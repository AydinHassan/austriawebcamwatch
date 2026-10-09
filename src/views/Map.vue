<script setup>
import { VMap, VMapOsmTileLayer, VMapZoomControl } from 'vue-map-ui';
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'

import 'leaflet/dist/leaflet.css';
import 'vue-map-ui/dist/style.css';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import * as L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster.js";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import {Button} from "@/components/ui/button";
import { Badge } from '@/components/ui/badge'
import { CaretSortIcon, CheckIcon } from '@radix-icons/vue'
import { usePresetsStore } from '@/stores/presets'

useHead({
  title: 'Austria Webcam Map – Austria Webcam Watch',
  link: [{ rel: 'canonical', href: 'https://www.austriawebcamwatch.at/map' }],
})

const mapRef = ref(null);
const presetsStore = usePresetsStore()

import webcams from '@/assets/austria-cams.json';
import Provider from '@/components/Provider.vue'

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-9">
  <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
</svg>
    `;

const providers = [
  { value: 'all', label: 'All providers', badge: '' },
  { value: 'panomax', label: 'Panomax', badge: 'border-green-400/20 text-green-500' },
  { value: 'bergfex', label: 'Bergfex', badge: 'border-sky-400/20 text-sky-500' },
]
const providerFilter = ref('all')
const currentProvider = computed(() => providers.find((p) => p.value === providerFilter.value))

let markerCluster = null

const addMarkers = (map) => {
  markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true,
    chunkedLoading: true,
  });

  const icon = L.divIcon({
    className: 'radix-icon text-blue-500/70',  // You can style the icon with custom class
    html: svgIcon,
    iconAnchor: [16, 32],  // Position anchor point
    popupAnchor: [0, -32],  // Popup position
  });

  webcams.forEach((webcam) => {
    if (webcam.latitude === null || webcam.longitude === null) {
      return;
    }
    if (providerFilter.value !== 'all' && webcam.provider !== providerFilter.value) {
      return;
    }


    const marker = L.marker([webcam.latitude, webcam.longitude], { icon: icon });

    marker.on('click', () => {
      selectedWebcam.value = webcam;
      open.value = true;
    });

    markerCluster.addLayer(marker);
  });

  // Some webcams share (near) identical coordinates, so their cluster can never
  // be split by zooming. leaflet.markercluster only spiderfies automatically when
  // the whole cluster survives down to its deepest zoom level; a cluster mixing a
  // co-located pair with a slightly offset marker fails that check and silently
  // does nothing once the map is at max zoom. Spiderfy those by hand.
  markerCluster.on('clusterclick', (e) => {
    if (map.getZoom() >= map.getMaxZoom()) {
      e.layer.spiderfy();
    }
  });

  map.addLayer(markerCluster);
}

const menu = reactive({ open: false, x: 0, y: 0, fromChip: false })
const toggleChipMenu = () => {
  menu.fromChip = true
  menu.open = !menu.open
}
const closeMenu = () => { menu.open = false }

watch(providerFilter, () => {
  const map = mapRef.value?.map
  if (!map) return
  if (markerCluster) map.removeLayer(markerCluster)
  addMarkers(map)
})

watch(
  () => mapRef.value?.map, (map) => {
    if (map) {
      // Must be set before the cluster group is added: it snapshots the map's max
      // zoom to decide at which level a cluster is allowed to spiderfy. The tile
      // layer mounts after this watcher, so without an explicit value the map
      // still reports Infinity here.
      map.setMaxZoom(19);
      addMarkers(map);
      map.on('contextmenu', (e) => {
        menu.x = e.containerPoint.x;
        menu.y = e.containerPoint.y;
        menu.fromChip = false;
        menu.open = true;
      });
      map.on('movestart click', closeMenu);
    }
  }
);

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
function onKey(e) { if (e.key === 'Escape') closeMenu() }

const open = ref(false);

const selectedWebcam = ref(null);

</script>
<template>
  <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
    <div class="flex w-full flex-col gap-3">
      <div class="relative flex flex-1">
        <VMap ref="mapRef" class="flex-1 z-1" :center="[47.7000, 13.7000]" zoom="8" min-zoom="8" :theme="'dark'">
          <VMapOsmTileLayer :max-zoom="19" />
          <VMapZoomControl />
        </VMap>
        <button
          type="button"
          class="absolute bottom-6 left-3 z-[1000] flex items-center gap-1.5 rounded-full border bg-popover px-2.5 py-1 text-xs shadow-md hover:bg-accent"
          aria-label="Filter by provider"
          aria-haspopup="menu"
          :aria-expanded="menu.open"
          @click.stop="toggleChipMenu"
        >
          <Badge v-if="currentProvider.badge" variant="outline" :class="['text-[9px]', currentProvider.badge]">{{ currentProvider.label }}</Badge>
          <span v-else>{{ currentProvider.label }}</span>
          <CaretSortIcon class="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div
          v-if="menu.open"
          class="absolute z-[1000] min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          :style="menu.fromChip ? { left: '12px', bottom: '56px' } : { left: menu.x + 'px', top: menu.y + 'px' }"
          @click.stop
          @contextmenu.prevent
        >
          <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Show providers</div>
          <button
            v-for="p in providers"
            :key="p.value"
            type="button"
            class="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            @click="providerFilter = p.value; menu.open = false"
          >
            <CheckIcon v-if="providerFilter === p.value" class="absolute left-2 h-4 w-4" />
            <Badge v-if="p.badge" variant="outline" :class="['text-[9px]', p.badge]">{{ p.label }}</Badge>
            <template v-else>{{ p.label }}</template>
          </button>
        </div>
      </div>
      <Dialog v-model:open="open">
        <DialogContent v-if="selectedWebcam" class="flex flex-col max-w-5xl h-[800px]">
          <DialogHeader>
            <DialogTitle class="flex items-center">{{ selectedWebcam.name }} <Provider :cam="selectedWebcam"></Provider></DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div class="flex-1">
            <iframe  :src="selectedWebcam.url" class="h-full w-full"/>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="presetsStore.toggleWebcam(selectedWebcam); selectedWebcam = null">
              Add to watches
            </Button>
            <Button variant="secondary" @click="selectedWebcam = null">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
