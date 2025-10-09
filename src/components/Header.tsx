'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Menu, X, ShoppingCart, User, Search, MapPin } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const router = useRouter();

  // Vietnamese cities/districts for autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([
    'Quận 1, TP.HCM',
    'Quận 2, TP.HCM', 
    'Quận 3, TP.HCM',
    'Quận 7, TP.HCM',
    'Quận Bình Thạnh, TP.HCM',
    'Quận Phú Nhuận, TP.HCM',
    'Quận Tân Bình, TP.HCM',
    'Ba Đình, Hà Nội',
    'Hoàn Kiếm, Hà Nội',
    'Cầu Giấy, Hà Nội',
    'Đống Đa, Hà Nội',
    'Hải Châu, Đà Nẵng',
    'Thanh Khê, Đà Nẵng'
  ]);

  // Fetch location suggestions from API
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([
        'Quận 1, TP.HCM', 'Quận 2, TP.HCM', 'Quận 3, TP.HCM',
        'Ba Đình, Hà Nội', 'Hoàn Kiếm, Hà Nội', 'Hải Châu, Đà Nẵng'
      ]);
      return;
    }

    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const suggestions = data.data.map((item: any) => item.address);
          setLocationSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    }
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
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (location.trim()) {
      params.set('location', location.trim());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/equipments?${queryString}` : '/equipments';
    
    router.push(url);
  };

  const filteredLocations = locationSuggestions.filter(loc =>
    loc.toLowerCase().includes(location.toLowerCase())
  );

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
            {/* <span className="text-2xl font-bold text-gray-900">VShare</span> */}
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="flex w-full bg-gray-50 rounded-lg border border-gray-200">
              {/* Location Input */}
              <div className="relative flex-1">
                <div className="flex items-center px-3 py-2 border-r border-gray-200">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Chọn địa điểm"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setShowLocationDropdown(true);
                      fetchLocationSuggestions(e.target.value);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    className="bg-transparent border-none outline-none text-sm flex-1 placeholder-gray-500"
                  />
                </div>
                
                {/* Location Dropdown */}
                {showLocationDropdown && location && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredLocations.slice(0, 8).map((loc, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setLocation(loc);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
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
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <Link href="/equipments" className="text-gray-700 hover:text-orange-600 transition-colors text-sm font-medium">
              Thiết bị
            </Link>
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-orange-600 transition-colors">
              <User className="h-6 w-6" />
            </Link>
            <Link href="/register" className="btn-primary">
              Đăng ký
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
              <Link
                href="/equipments"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Thiết bị
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Về chúng tôi
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Liên hệ
              </Link>
              <div className="pt-4 space-y-2">
                <Link
                  href="/cart"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Giỏ hàng
                </Link>
                <Link
                  href="/login"
                  className="flex items-center px-3 py-2 text-gray-700 hover:text-orange-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 bg-orange-600 text-white rounded-lg text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
