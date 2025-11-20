'use client';

import { useEffect, useRef } from 'react';

interface PlaceKitAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

interface PlaceKitItem {
  lat: number;
  lng: number;
  name: string;
  city?: string;
  country?: string;
}

interface PlaceKitInstance {
  on: (event: string, callback: (value: string, item?: PlaceKitItem) => void) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    placekitAutocomplete: (apiKey: string, options: Record<string, unknown>) => PlaceKitInstance;
  }
}

export default function PlaceKitAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Nhập địa điểm...",
  className = ""
}: PlaceKitAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pkInstanceRef = useRef<PlaceKitInstance | null>(null);

  useEffect(() => {
    // Wait for PlaceKit script to load
    const initPlaceKit = () => {
      if (typeof window !== 'undefined' && window.placekitAutocomplete && inputRef.current) {
        try {
          // Initialize PlaceKit
          const apiKey = process.env.NEXT_PUBLIC_PLACEKIT_API_KEY || 'pk_mGcv5ku8q/90kbjxq/xaLE9jg77pvsvGsD65kImAy7Q=';
          
          pkInstanceRef.current = window.placekitAutocomplete(apiKey, {
            target: inputRef.current,
            countries: ['vn'], // Focus on Vietnam
            language: 'vi', // Vietnamese language
            placeholder: placeholder,
            types: ['city', 'street', 'administrative'], // Address types
            maxResults: 5,
            offset: 0,
            panel: {
              className: 'placekit-custom-panel'
            }
          });

          // Listen for selection
          pkInstanceRef.current.on('pick', (value: string, item?: PlaceKitItem) => {
            console.log('PlaceKit picked:', item);
            
            if (item && item.lat && item.lng) {
              // Update input value
              const address = item.name || value;
              onChange(address);
              
              // Notify parent with coordinates
              if (onLocationSelect) {
                onLocationSelect({
                  lat: item.lat,
                  lng: item.lng,
                  address: address
                });
              }
            }
          });

          // Listen for input changes (manual typing)
          pkInstanceRef.current.on('change', (value: string) => {
            onChange(value);
          });

          // Listen for clear
          pkInstanceRef.current.on('clear', () => {
            onChange('');
          });

        } catch (error) {
          console.error('Error initializing PlaceKit:', error);
        }
      }
    };

    // Check if script is already loaded
    if (typeof window.placekitAutocomplete !== 'undefined') {
      initPlaceKit();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (typeof window.placekitAutocomplete !== 'undefined') {
          clearInterval(checkInterval);
          initPlaceKit();
        }
      }, 100);

      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);

      return () => clearInterval(checkInterval);
    }

    // Cleanup
    return () => {
      if (pkInstanceRef.current && pkInstanceRef.current.destroy) {
        pkInstanceRef.current.destroy();
      }
    };
  }, [placeholder, onChange, onLocationSelect]);

  // Update input value when prop changes
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      className={`w-full ${className}`}
      autoComplete="off"
    />
  );
}
