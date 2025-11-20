'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.8231, 106.6297]); // Ho Chi Minh City
  const [hoveredEquipment, setHoveredEquipment] = useState<string | null>(null);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const mapMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get search queries from URL params
  const searchQuery = searchParams.get('q') || '';
  const locationQuery = searchParams.get('location') || '';
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const radiusParam = searchParams.get('radius');

  // Search function
  const searchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use lat/lng from URL params if available
      if (latParam && lngParam) {
        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const locationInfo = {
            lat,
            lng,
            address: locationQuery || `${lat}, ${lng}`
          };
          setSearchedLocation(locationInfo);
          setMapCenter([lat, lng]);
          console.log('Using coordinates from URL:', locationInfo);
        }
      } else if (locationQuery) {
        // Only geocode if no lat/lng provided in URL
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
      
      // Pass lat/lng/radius to API
      if (latParam) params.set('lat', latParam);
      if (lngParam) params.set('lng', lngParam);
      if (radiusParam) params.set('radius', radiusParam);
      
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
      
      console.log('API URL:', `/api/equipment/search?${params.toString()}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Không thể tải danh sách thiết bị (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (data.success) {
        // Transform API data to match Equipment interface
        const equipmentArray = data.data?.equipment || [];
        console.log('Equipment Array:', equipmentArray); // Debug log
        const transformedData = equipmentArray.map((item: Record<string, any>) => ({
          id: item._id || item.id || Math.random().toString(),
          name: item.title || item.name || 'Không có tên',
          price: item.pricePerDay || item.price || 0,
          category: item.category || 'other',
          rating: item.rating || 4.5,
          reviewCount: item.reviewCount || 0,
          image: (Array.isArray(item.images) && item.images.length > 0) ? item.images[0] : 
                 item.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
          location: item.location?.address || item.location || 'Chưa cập nhật',
          available: item.availability === 'available' || item.available !== false,
          coordinates: (item.location?.coordinates && Array.isArray(item.location.coordinates)) ? {
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
  }, [searchQuery, locationQuery, latParam, lngParam, radiusParam, sortBy]);

  // Search by coordinates (when clicking on map or dragging map)
  const searchByCoordinates = useCallback(async (lat: number, lng: number, radius: number = 5) => {
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
      if (searchQuery) params.set('q', searchQuery);
      params.set('location', locationSearchTerm);
      params.set('lat', lat.toString());
      params.set('lng', lng.toString());
      params.set('radius', radius.toString());
      
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
        setSearchedLocation({
          lat,
          lng,
          address: locationSearchTerm
        });
        
        // Show notification about search
        console.log(`Tìm thấy ${transformedData.length} thiết bị trong bán kính ${radius}km`);
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
  }, [searchQuery]);

  // Handle map move (drag) with debouncing
  const handleMapMove = useCallback((lat: number, lng: number, zoom: number) => {
    // Clear previous timeout
    if (mapMoveTimeoutRef.current) {
      clearTimeout(mapMoveTimeoutRef.current);
    }
    
    // Calculate radius based on zoom level
    const radius = zoom >= 14 ? 3 : zoom >= 12 ? 5 : zoom >= 10 ? 10 : 20;
    
    // Set new timeout to search after user stops dragging (500ms for faster response)
    mapMoveTimeoutRef.current = setTimeout(() => {
      console.log('Map moved to:', { lat, lng, zoom, radius });
      
      // Search immediately for faster response
      searchByCoordinates(lat, lng, radius);
      
      // Update URL in background (non-blocking)
      fetch('/api/reverse-geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      })
        .then(response => response.json())
        .then(geoData => {
          let locationName = '';
          if (geoData.success && geoData.data && geoData.data.length > 0) {
            const result = geoData.data[0];
            locationName = result.city || result.district || result.formatted || `${lat},${lng}`;
          } else {
            locationName = `${lat},${lng}`;
          }
          
          // Update URL with new location
          const params = new URLSearchParams();
          if (searchQuery) params.set('q', searchQuery);
          params.set('location', locationName);
          params.set('lat', lat.toString());
          params.set('lng', lng.toString());
          params.set('radius', radius.toString());
          
          // Update URL without page reload
          router.replace(`/equipments?${params.toString()}`, { scroll: false });
        })
        .catch(error => {
          console.error('Error updating location:', error);
        });
    }, 500);
  }, [searchByCoordinates, searchQuery, router]);

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
      description: item.location,
      price: item.price,
      image: item.image,
      rating: item.rating,
      available: item.available
    }));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      

      {/* Main Content - Airbnb Style Layout: List | Map */}
      <div className="flex h-[90vh]">
        
        {/* Left Panel - Equipment List with its own scrollbar */}
        <div className="w-full lg:w-1/2 overflow-y-auto bg-white relative">
          {/* Results count with loading indicator */}
          <div className="sticky top-0 bg-white z-10 px-4 lg:px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center">
                <Search className="h-4 w-4 mr-2" />
                <span className="font-medium">{equipment.length} thiết bị được tìm thấy</span>
              </div>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                  Đang tìm...
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 lg:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-500 mb-4 text-lg">{error}</div>
                <button 
                  onClick={searchEquipment}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : equipment.length > 0 ? (
              <div className="space-y-6">
                {equipment.map((product) => (
                  <div
                    key={product.id}
                    onMouseEnter={() => setHoveredEquipment(product.id)}
                    onMouseLeave={() => setHoveredEquipment(null)}
                    className={`transition-all duration-200 rounded-lg border bg-white cursor-pointer hover:shadow-lg ${
                      hoveredEquipment === product.id 
                        ? 'border-orange-500 shadow-lg' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => window.location.href = `/equipment/${product.id}`}
                  >
                    <ProductCard {...product} />
                  </div>
                ))}
                
                {/* Load more or pagination can go here */}
                <div className="text-center py-8 text-gray-500">
                  <p>Đã hiển thị tất cả {equipment.length} thiết bị</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Không tìm thấy thiết bị
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {locationQuery ?
                    `Không có thiết bị nào tại "${locationQuery}". Thử mở rộng khu vực tìm kiếm.` :
                    'Không có thiết bị nào phù hợp với tìm kiếm của bạn.'
                  }
                </p>
                {searchedLocation && (
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const expandedParams = new URLSearchParams();
                        if (searchQuery) expandedParams.set('q', searchQuery);
                        if (locationQuery) expandedParams.set('location', locationQuery);
                        expandedParams.set('lat', searchedLocation.lat.toString());
                        expandedParams.set('lng', searchedLocation.lng.toString());
                        expandedParams.set('radius', '20'); // Expand to 20km
                        
                        window.location.href = `/equipments?${expandedParams.toString()}`;
                      }}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Mở rộng khu vực tìm kiếm (20km)
                    </button>
                    <p className="text-sm text-gray-500">
                      Hoặc click vào map để tìm kiếm ở vị trí khác
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Fixed Map */}
        <div className="hidden lg:block lg:w-1/2 sticky top-0">
          <div className="h-full relative">
            <Map 
              center={mapCenter}
              markers={mapMarkers.length > 0 ? mapMarkers : (searchedLocation ? [{
                id: 'searched-location',
                position: [searchedLocation.lat, searchedLocation.lng],
                title: 'Vị trí tìm kiếm',
                description: searchedLocation.address
              }] : [])}
              zoom={12}
              height="100%"
              className="h-full w-full"
              onLocationSelect={(lat, lng) => searchByCoordinates(lat, lng, 5)}
              onMapMove={handleMapMove}
            />
            
            {/* Map overlay with search info */}
            {equipment.length === 0 && searchedLocation && (
              <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Vị trí tìm kiếm: {searchedLocation.address}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Không tìm thấy thiết bị tại đây. Hãy thử mở rộng khu vực hoặc click vào map để tìm kiếm ở vị trí khác.
                    </p>
                  </div>
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