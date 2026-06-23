import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const TourMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Sleek dark mode
      center: [12.4922, 41.8902], // Colosseum coords
      zoom: 15
    });

    // Add a marker for the Colosseum
    new mapboxgl.Marker({ color: "#FFD700" }) // Gold marker
      .setLngLat([12.4922, 41.8902])
      .addTo(map.current);
  });

  return <div ref={mapContainer} className="h-screen w-full" />;
};

export default TourMap;
