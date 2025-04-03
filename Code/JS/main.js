// main.js
import { initializeMap } from './map.js';
import { loadLayerByZoom } from './dataLayer.js';

function main() {
    console.log("Initializing Precipi-Tracker...");
    const map = initializeMap();
    map.whenReady(loadLayerByZoom);
    map.on('zoomend', loadLayerByZoom);
    map.on('moveend', loadLayerByZoom);
}

main();
