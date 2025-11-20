'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface MapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    price?: number;
    image?: string;
    rating?: number;
    available?: boolean;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  onMapMove?: (lat: number, lng: number, zoom: number) => void;
  height?: string;
  className?: string;
}

// Leaflet Map Component (client-side only)
function LeafletMap({ 
  center, 
  zoom = 12, 
  markers = [], 
  onLocationSelect,
  onMapMove,
  height = '400px',
  className = '' 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstance.current) return;

    const initializeMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix for default markers in leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Validate center coordinates
        const validCenter: [number, number] = (
          center && 
          Array.isArray(center) && 
          typeof center[0] === 'number' && 
          typeof center[1] === 'number' &&
          !isNaN(center[0]) && 
          !isNaN(center[1])
        ) ? center : [10.8231, 106.6297]; // Ho Chi Minh City default

        // Initialize map with proper options
        mapInstance.current = L.map(mapRef.current!, {
          center: validCenter,
          zoom: zoom,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 3
        }).addTo(mapInstance.current);

        // Set Vietnam bounds for better UX
        const vietnamBounds = L.latLngBounds(
          L.latLng(8.560, 102.144), // Southwest
          L.latLng(23.393395, 109.464) // Northeast
        );
        mapInstance.current.setMaxBounds(vietnamBounds);

        // Force map to calculate size properly
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            mapInstance.current.setView(validCenter, zoom);
          }
          setIsLoading(false);
        }, 100);

        // Additional invalidation for stubborn sizing issues
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 500);

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isClient]);

  // Handle center and zoom updates
  useEffect(() => {
    if (!mapInstance.current || !isClient) return;

    const validCenter: [number, number] = (
      center && 
      Array.isArray(center) && 
      typeof center[0] === 'number' && 
      typeof center[1] === 'number' &&
      !isNaN(center[0]) && 
      !isNaN(center[1])
    ) ? center : [10.8231, 106.6297];

    mapInstance.current.setView(validCenter, zoom);
  }, [center, zoom, isClient]);

  // Handle click events
  useEffect(() => {
    if (!mapInstance.current || !onLocationSelect || !isClient) return;

    const clickHandler = (e: any) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    };

    mapInstance.current.on('click', clickHandler);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', clickHandler);
      }
    };
  }, [onLocationSelect, isClient]);

  // Handle map movement (drag end)
  useEffect(() => {
    if (!mapInstance.current || !onMapMove || !isClient) return;

    const moveEndHandler = () => {
      if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        const currentZoom = mapInstance.current.getZoom();
        onMapMove(center.lat, center.lng, currentZoom);
      }
    };

    // Trigger on drag end and zoom end
    mapInstance.current.on('dragend', moveEndHandler);
    mapInstance.current.on('zoomend', moveEndHandler);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('dragend', moveEndHandler);
        mapInstance.current.off('zoomend', moveEndHandler);
      }
    };
  }, [onMapMove, isClient]);

  // Handle markers
  useEffect(() => {
    if (!mapInstance.current || !isClient) return;

    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');

        // Clear existing markers
        markersRef.current.forEach(marker => {
          if (mapInstance.current) {
            mapInstance.current.removeLayer(marker);
          }
        });
        markersRef.current = [];

        // Add new markers
        markers.forEach(markerData => {
          if (
            markerData.position && 
            Array.isArray(markerData.position) &&
            typeof markerData.position[0] === 'number' && 
            typeof markerData.position[1] === 'number' &&
            !isNaN(markerData.position[0]) && 
            !isNaN(markerData.position[1])
          ) {
            const marker = L.marker(markerData.position)
              .addTo(mapInstance.current)
              .bindPopup(`
                <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
                  ${markerData.image ? `
                    <img src="${markerData.image}" alt="${markerData.title}" 
                         style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
                  ` : ''}
                  <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 16px; color: #1f2937;">${markerData.title}</h3>
                  ${markerData.price ? `
                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #059669;">
                      ${markerData.price.toLocaleString('vi-VN')}đ/ngày
                    </p>
                  ` : ''}
                  ${markerData.rating ? `
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <span style="color: #fbbf24; margin-right: 4px;">★</span>
                      <span style="font-size: 12px; color: #374151;">${markerData.rating} ${markerData.available !== false ? '• Có sẵn' : '• Không có sẵn'}</span>
                    </div>
                  ` : ''}
                  ${markerData.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${markerData.description}</p>` : ''}
                  <a href="/equipment/${markerData.id}" 
                     style="display: inline-block; padding: 6px 12px; background: #ea580c; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;"
                     target="_blank">
                    Xem chi tiết
                  </a>
                </div>
              `, {
                maxWidth: 280,
                className: 'equipment-popup'
              });
            
            markersRef.current.push(marker);
          }
        });
      } catch (error) {
        console.error('Failed to update markers:', error);
      }
    };

    updateMarkers();
  }, [markers, isClient]);

  // Handle container resize
  useEffect(() => {
    if (!mapInstance.current || !isClient) return;

    const handleResize = () => {
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 100);
    };

    const currentRef = mapRef.current;
    let resizeObserver: ResizeObserver | null = null;
    
    if (typeof ResizeObserver !== 'undefined' && currentRef) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(currentRef);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver && currentRef) {
        resizeObserver.unobserve(currentRef);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div 
        style={{ height }} 
        className={`w-full rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center ${className}`}
      >
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
          <span>Đang tải bản đồ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
            <span>Đang tải bản đồ...</span>
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg border border-gray-200 overflow-hidden"
      />
    </div>
  );
}

// Export the component with no SSR
const Map = dynamic(() => Promise.resolve(LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
        <span>Đang tải bản đồ...</span>
      </div>
    </div>
  )
});

export default Map;