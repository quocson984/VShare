'use client';

import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

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

export default function FallbackMap({ 
  center, 
  zoom = 12, 
  markers = [], 
  onLocationSelect,
  height = '400px',
  className = '' 
}: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Vietnam center coordinates
  const mapCenter = {
    lat: center[0] || 10.8231,
    lng: center[1] || 106.6297
  };

  // Create static map URL for display
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng-0.02},${mapCenter.lat-0.02},${mapCenter.lng+0.02},${mapCenter.lat+0.02}&layer=mapnik`;

  return (
    <div style={{ height }} className={`relative ${className}`}>
      {/* Static Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
        <iframe
          src={staticMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          className="opacity-80"
        />
      </div>

      {/* Overlay with markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg max-w-md mx-4">
          <div className="text-center mb-4">
            <Navigation className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Vị trí thiết bị</h3>
            <p className="text-sm text-gray-600">
              {markers.length} thiết bị gần khu vực này
            </p>
          </div>

          {/* Equipment list */}
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {markers.slice(0, 4).map((marker, index) => (
              <div 
                key={marker.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMarker === marker.id 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMarker(selectedMarker === marker.id ? null : marker.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {marker.title}
                    </h4>
                    {marker.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {marker.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ~{Math.round(Math.random() * 2 + 0.5)} km
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {markers.length > 4 && (
            <div className="text-center mt-3">
              <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Xem thêm {markers.length - 4} thiết bị khác
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2 mt-4">
            <button className="flex-1 bg-orange-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors">
              Xem bản đồ đầy đủ
            </button>
            <button 
              onClick={() => onLocationSelect && onLocationSelect(mapCenter.lat, mapCenter.lng)}
              className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Chọn vị trí
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}