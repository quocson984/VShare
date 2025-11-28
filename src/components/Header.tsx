'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Menu, X, Heart, User, Search, MapPin } from 'lucide-react';
import PlaceKitAutocomplete from './PlaceKitAutocomplete';
import PersonalDashboard from './PersonalDashboard';

interface HeaderProps {
  hideSearch?: boolean;
}

export default function Header({ hideSearch = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [user, setUser] = useState<{id: string, email: string, name: string} | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize search values from URL params and user state
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('location') || '';
    setSearchQuery(q);
    setLocation(loc);
    
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
      }
    }
  }, [searchParams]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  // Equipment suggestions for autocomplete  
  const equipmentSuggestions = [
    'Camera Canon',
    'Camera Sony',
    'Sony FX6',
    'Canon EOS R5',
    'Lighting kit',
    'Lens 24-70mm',
    'Tripod',
    'Drone DJI',
    'Microphone',
    'Audio recorder'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Starting search with:', { searchQuery, location, locationCoords });
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    
    // Handle location search
    if (location.trim()) {
      params.set('location', location.trim());
      
      // Use stored coordinates from PlaceKit selection
      if (locationCoords) {
        params.set('lat', locationCoords.lat.toString());
        params.set('lng', locationCoords.lng.toString());
        params.set('radius', '10'); // Default 10km radius
        console.log('✅ Using PlaceKit coordinates:', locationCoords);
      } else {
        console.warn('⚠️ No coordinates - user may have typed manually without selecting from PlaceKit');
        // Still allow search by location text only
      }
    }
    
    const queryString = params.toString();
    const url = queryString ? `/equipments?${queryString}` : '/equipments';
    
    console.log('🚀 Final URL:', url);
    console.log('📋 All params:', Object.fromEntries(params));
    router.push(url);
    
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  const filteredEquipment = equipmentSuggestions.filter(eq =>
    eq.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Camera className="h-8 w-8 text-orange-600" />
          </Link>

          {/* Search Bar */}
          {!hideSearch && (
            <div className="hidden md:flex flex-1 max-w-4xl mx-[15vw]">
              <form onSubmit={handleSearch} className="flex w-full">
                {/* Main Search Bar */}
                <div className="flex bg-gray-50 rounded-lg border border-gray-200 flex-1">
                  {/* Location Input */}
                  <div className="relative flex-1">
                    <div className="flex items-center border-r border-gray-200">
                      <MapPin className="h-4 w-4 text-gray-400 ml-3 mr-2" />
                      <PlaceKitAutocomplete
                        value={location}
                        onChange={(value) => {
                          setLocation(value);
                          // Clear coords if value is empty
                          if (!value) {
                            setLocationCoords(null);
                          }
                        }}
                        onLocationSelect={(selectedLocation) => {
                          setLocation(selectedLocation.address);
                          setLocationCoords({
                            lat: selectedLocation.lat,
                            lng: selectedLocation.lng
                          });
                          console.log('✅ PlaceKit selected location:', selectedLocation);
                        }}
                        placeholder="Chọn địa điểm"
                        className="bg-transparent border-none text-sm placeholder-gray-500 focus:outline-none focus:ring-0 px-2 py-2"
                      />
                    </div>
                  </div>

                  {/* Equipment Search Input */}
                  <div className="relative flex-1">
                    <div className="flex items-center px-3 py-2">
                      <input
                        type="text"
                        placeholder="Nhập tên thiết bị..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowEquipmentDropdown(true);
                        }}
                        onFocus={() => setShowEquipmentDropdown(true)}
                        onBlur={() => setTimeout(() => setShowEquipmentDropdown(false), 200)}
                        className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-500"
                      />
                    </div>
                    
                    {/* Equipment Dropdown */}
                    {showEquipmentDropdown && searchQuery && filteredEquipment.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        {filteredEquipment.slice(0, 6).map((equipment, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSearchQuery(equipment);
                              setShowEquipmentDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          >
                            {equipment}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {!hideSearch && (
              <button className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
                <Heart className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>
            )}
            {user ? (
              <PersonalDashboard user={user} onLogout={handleLogout} />
            ) : (
              <button onClick={handleLogin} className="btn-primary">
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            {/* Mobile Search Bar */}
            <div className="px-4 py-3 border-b border-gray-200">
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Chọn địa điểm"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      placeholder="Tìm thiết bị"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-500"
                    />
                    <button
                      type="submit"
                      className="ml-2 p-1 text-orange-600"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <div className="pt-4 space-y-2">
                <button className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors w-full text-left">
                  <Heart className="h-5 w-5 mr-2" />
                  Yêu thích
                </button>
                {user ? (
                  <div className="px-3 py-2">
                    <PersonalDashboard user={user} onLogout={handleLogout} />
                  </div>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="block px-3 py-2 bg-orange-600 text-white rounded-lg text-center w-full"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
