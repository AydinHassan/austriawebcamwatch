<script setup>
import { VMap, VMapOsmTileLayer, VMapZoomControl } from 'vue-map-ui';
import { inject, onMounted, provide, ref, watch } from 'vue'

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

const mapRef = ref(null);

import webcams from '@/assets/austria-cams.json';
import Provider from '@/components/Provider.vue'
const addSelectedWebcam = inject('addSelectedWebcam');

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-9">
  <path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
</svg>
    `;

const addMarkers = (map) => {
  const markerCluster = L.markerClusterGroup({
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


    const marker = L.marker([webcam.latitude, webcam.longitude], { icon: icon });

    marker.on('click', () => {
      selectedWebcam.value = webcam;
      open.value = true;
    });

    markerCluster.addLayer(marker);
  });

  map.addLayer(markerCluster);
}

watch(
  () => mapRef.value?.map, (map) => {
    if (map) {
      map._layersMaxZoom = 19;
      addMarkers(map);
    }
  }
);

const open = ref(false);

const selectedWebcam = ref(null);

</script>
<template>
  <div class="flex flex-1 flex-grow overflow-scroll space-y-4 p-4">
    <div class="flex w-full">
      <VMap ref="mapRef" class="h-full z-1" :center="[47.7000, 13.7000]" zoom="8" min-zoom="8" :theme="'dark'">
        <VMapOsmTileLayer  />
        <VMapZoomControl />
      </VMap>
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
            <Button variant="outline" @click="addSelectedWebcam(selectedWebcam.name); selectedWebcam = null">
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
