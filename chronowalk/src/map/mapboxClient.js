import mapboxgl from 'mapbox-gl'
import MapboxWorker from 'mapbox-gl/dist/mapbox-gl-csp-worker?worker'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.workerClass = MapboxWorker

export default mapboxgl
