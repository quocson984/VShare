'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import Map from '@/components/Map';
import { 
  Search,
  MapPin
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  location: string;
  available: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

function EquipmentsPage() {
  const searchParams = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.8231, 106.6297]); // Ho Chi Minh City
  const [hoveredEquipment, setHoveredEquipment] = useState<string | null>(null);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{lat: number, lng: number, address: string} | null>(null);

  // Get search queries from URL params
  const searchQuery = searchParams.get('q') || '';
  const locationQuery = searchParams.get('location') || '';

  // Search function
  const searchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If we have a location query, try to geocode it first to update map center
      if (locationQuery) {
        try {
          const geoResponse = await fetch('/api/geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: locationQuery }),
          });
          const geoData = await geoResponse.json();
          
          if (geoData.success && geoData.data && geoData.data.length > 0) {
            const location = geoData.data[0];
            const locationInfo = {
              lat: location.lat,
              lng: location.lon,
              address: location.formatted
            };
            setSearchedLocation(locationInfo);
            setMapCenter([location.lat, location.lon]);
          }
        } catch (geoError) {
          console.error('Geocoding error:', geoError);
        }
      }
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (locationQuery) params.set('location', locationQuery);
      
      // Add sorting
      if (sortBy === 'price-low') {
        params.set('sortBy', 'pricePerDay');
        params.set('order', 'asc');
      } else if (sortBy === 'price-high') {
        params.set('sortBy', 'pricePerDay');
        params.set('order', 'desc');
      } else if (sortBy === 'rating') {
        params.set('sortBy', 'rating');
        params.set('order', 'desc');
      }
      
      const response = await fetch(`/api/equipment/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách thiết bị');
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (data.success) {
        // Transform API data to match Equipment interface
        const equipmentArray = data.data?.equipment || [];
        console.log('Equipment Array:', equipmentArray); // Debug log
        const transformedData = equipmentArray.map((item: Record<string, unknown>) => ({
          id: item._id || item.id || Math.random().toString(),
          name: item.title || item.name || 'Không có tên',
          price: item.pricePerDay || item.price || 0,
          category: item.category || 'other',
          rating: item.rating || 4.5,
          reviewCount: item.reviewCount || 0,
          image: (item.images && item.images.length > 0) ? item.images[0] : 
                 item.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
          location: item.location?.address || item.location || 'Chưa cập nhật',
          available: item.availability === 'available' || item.available !== false,
          coordinates: item.location?.coordinates ? {
            lat: item.location.coordinates[1] || item.location.coordinates.lat,
            lng: item.location.coordinates[0] || item.location.coordinates.lng
          } : undefined
        }));
        
        setEquipment(transformedData);
        
        // Update map center if equipment found and has coordinates
        if (transformedData.length > 0) {
          const firstItemWithCoords = transformedData.find((item: Equipment) => 
            item.coordinates && 
            typeof item.coordinates.lat === 'number' && 
            typeof item.coordinates.lng === 'number' &&
            !isNaN(item.coordinates.lat) && 
            !isNaN(item.coordinates.lng)
          );
          if (firstItemWithCoords) {
            setMapCenter([firstItemWithCoords.coordinates!.lat, firstItemWithCoords.coordinates!.lng]);
          }
        }
      } else {
        setError(data.message || 'Có lỗi xảy ra khi tìm kiếm');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, locationQuery, sortBy]);

  // Search by coordinates (when clicking on map)
  const searchByCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use reverse geocoding with server-side API
      const geoResponse = await fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });
      const geoData = await geoResponse.json();
      
      let locationSearchTerm = '';
      if (geoData.success && geoData.data && geoData.data.length > 0) {
        const result = geoData.data[0];
        locationSearchTerm = result.city || result.district || result.formatted || `${lat},${lng}`;
      } else {
        locationSearchTerm = `${lat},${lng}`;
      }
      
      // Search equipment near this location
      const params = new URLSearchParams();
      params.set('location', locationSearchTerm);
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
      params.set('radius', '5'); // 5km radius
      
      const response = await fetch(`/api/equipment/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        // Transform API data to match Equipment interface
        const equipmentArray = data.data?.equipment || [];
        const transformedData = equipmentArray.map((item: Record<string, unknown>) => ({
          id: item._id || item.id || Math.random().toString(),
          name: item.title || item.name || 'Không có tên',
          price: item.pricePerDay || item.price || 0,
          category: item.category || 'other',
          rating: item.rating || 4.5,
          reviewCount: item.reviewCount || 0,
          image: (item.images && item.images.length > 0) ? item.images[0] : 
                 item.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
          location: item.location?.address || item.location || 'Chưa cập nhật',
          available: item.availability === 'available' || item.available !== false,
          coordinates: item.location?.coordinates ? {
            lat: item.location.coordinates[1] || item.location.coordinates.lat,
            lng: item.location.coordinates[0] || item.location.coordinates.lng
          } : undefined
        }));
        
        setEquipment(transformedData);
        setMapCenter([lat, lng]);
        
        // Show notification about search
        console.log(`Tìm thấy ${transformedData.length} thiết bị gần vị trí đã chọn`);
      } else {
        setError(data.message || 'Không tìm thấy thiết bị tại vị trí này');
        setEquipment([]);
      }
    } catch (err) {
      console.error('Coordinate search error:', err);
      setError('Lỗi kết nối server');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial search
  useEffect(() => {
    searchEquipment();
  }, [searchEquipment]);

  // Prepare markers for map
  const mapMarkers = equipment
    .filter(item => item.coordinates && 
                   typeof item.coordinates.lat === 'number' && 
                   typeof item.coordinates.lng === 'number' &&
                   !isNaN(item.coordinates.lat) && 
                   !isNaN(item.coordinates.lng))
    .map(item => ({
      id: item.id,
      position: [item.coordinates!.lat, item.coordinates!.lng] as [number, number],
      title: item.name,
      description: `${item.price.toLocaleString('vi-VN')}đ/ngày - ${item.location}`
    }));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section with Search Results Count */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {searchQuery || locationQuery ? 'Kết quả tìm kiếm' : 'Tất cả thiết bị'}
              </h1>
              {(searchQuery || locationQuery) && (
                <p className="mt-1 text-sm text-gray-600">
                  {searchQuery && `"${searchQuery}"`}
                  {searchQuery && locationQuery && ' tại '}
                  {locationQuery && `"${locationQuery}"`}
                </p>
              )}
              <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
                <span className="inline-flex items-center">
                  <Search className="h-4 w-4 mr-1" />
                  {equipment.length} thiết bị được tìm thấy
                </span>
                {/* Mobile Map Toggle Button */}
                <button
                  onClick={() => setShowMapOnMobile(!showMapOnMobile)}
                  className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMapOnMobile ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Bản đồ thiết bị</h2>
            <button
              onClick={() => setShowMapOnMobile(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
          <div className="flex-1">
            <Map 
              center={mapCenter}
              markers={equipment.length > 0 ? mapMarkers : searchedLocation ? [{
                id: 'searched-location',
                position: [searchedLocation.lat, searchedLocation.lng] as [number, number],
                title: 'Vị trí tìm kiếm',
                description: searchedLocation.address
              }] : []}
              zoom={12}
              className="h-full w-full"
              onLocationSelect={searchByCoordinates}
            />
          </div>
        </div>
      )}

      {/* Main Content - Airbnb Style Layout */}
      <div className="lg:flex lg:h-screen lg:max-h-screen">
        
        {/* Left Panel - Equipment List (50% width on desktop, full width on mobile) */}
        <div className="w-full lg:w-1/2">
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
                <span className="inline-flex items-center">
                  <Search className="h-4 w-4 mr-1" />
                  {equipment.length} thiết bị được tìm thấy
                </span>
              </div>
          <div className="max-w-none px-4 lg:px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">{error}</div>
                <button 
                  onClick={searchEquipment}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Thử lại
                </button>
              </div>
            ) : equipment.length > 0 ? (
              <div className="space-y-4 pb-8">
                {equipment.map((product) => (
                  <div
                    key={product.id}
                    onMouseEnter={() => setHoveredEquipment(product.id)}
                    onMouseLeave={() => setHoveredEquipment(null)}
                    className={`transition-all duration-200 rounded-lg p-4 border bg-white cursor-pointer ${
                      hoveredEquipment === product.id 
                        ? 'border-orange-500 shadow-lg transform scale-[1.02]' 
                        : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                    }`}
                    onClick={() => window.location.href = `/equipment/${product.id}`}
                  >
                    <ProductCard {...product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy thiết bị
                </h3>
                <p className="text-gray-600 mb-4">
                  {locationQuery ? 
                    `Không có thiết bị nào tại "${locationQuery}". Thử mở rộng khu vực tìm kiếm.` :
                    'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                  }
                </p>
                {searchedLocation && (
                  <button
                    onClick={() => {
                      // Expand search radius by searching nearby areas
                      const expandedParams = new URLSearchParams();
                      if (searchQuery) expandedParams.set('q', searchQuery);
                      expandedParams.set('lat', searchedLocation.lat.toString());
                      expandedParams.set('lng', searchedLocation.lng.toString());
                      expandedParams.set('radius', '10'); // Expand to 10km
                      
                      window.location.href = `/equipments?${expandedParams.toString()}`;
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Mở rộng khu vực tìm kiếm (10km)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map (50% width on desktop, hidden on mobile, sticky position) */}
        <div className="hidden lg:block lg:w-1/2 lg:h-screen lg:sticky lg:top-0">
          <div className="h-full bg-gray-200">
            <Map 
              center={mapCenter}
              markers={equipment.length > 0 ? mapMarkers : searchedLocation ? [{
                id: 'searched-location',
                position: [searchedLocation.lat, searchedLocation.lng] as [number, number],
                title: 'Vị trí tìm kiếm',
                description: searchedLocation.address
              }] : []}
              zoom={12}
              height="100%"
              className="h-full w-full"
              onLocationSelect={searchByCoordinates}
            />
            {equipment.length === 0 && searchedLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy thiết bị tại &quot;{searchedLocation.address}&quot;
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Thử mở rộng khu vực tìm kiếm hoặc thay đổi từ khóa
                  </p>
                  <button
                    onClick={() => {
                      // Expand search radius by searching nearby areas
                      const expandedParams = new URLSearchParams();
                      if (searchQuery) expandedParams.set('q', searchQuery);
                      expandedParams.set('lat', searchedLocation.lat.toString());
                      expandedParams.set('lng', searchedLocation.lng.toString());
                      expandedParams.set('radius', '10'); // Expand to 10km
                      
                      window.location.href = `/equipments?${expandedParams.toString()}`;
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Mở rộng khu vực tìm kiếm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipmentsPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <EquipmentsPage />
    </Suspense>
  );
}

export { EquipmentsPageWithSuspense as default };