'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

export default function Map({ 
  center, 
  zoom = 13, 
  markers = [], 
  onLocationSelect,
  height = '400px',
  className = '' 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    // Add click handler for location selection
    if (onLocationSelect) {
      mapInstance.current.on('click', (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    // Vietnam bounds for constraining view
    const vietnamBounds = L.latLngBounds(
      L.latLng(8.560, 102.144), // Southwest
      L.latLng(23.393395, 109.464) // Northeast
    );
    
    mapInstance.current.setMaxBounds(vietnamBounds);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Update map center
    mapInstance.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstance.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker(markerData.position)
        .addTo(mapInstance.current!)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${markerData.title}</h3>
            ${markerData.description ? `<p class="text-xs text-gray-600 mt-1">${markerData.description}</p>` : ''}
          </div>
        `);
      
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full rounded-lg border border-gray-200 ${className}`}
    />
  );
}