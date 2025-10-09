'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { 
  Filter, 
  Grid, 
  List, 
  Search
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
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment from database
  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedLocation !== 'all') params.set('location', selectedLocation);
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());
      
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
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.equipment) {
          // Transform API data to match the UI structure
          const transformedData = data.data.equipment.map((item: any) => ({
            id: item.id,
            name: item.title,
            category: item.category,
            price: item.pricePerDay,
            rating: item.rating || 4.5,
            reviewCount: item.reviewCount || 0,
            image: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
            location: item.location?.address || 'Chưa cập nhật',
            available: item.availability === 'available'
          }));
          setEquipment(transformedData);
        } else {
          setError('Không có dữ liệu thiết bị');
          setEquipment([]);
        }
      } else {
        throw new Error('Không thể tải dữ liệu thiết bị');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, sortBy]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 mb-8 lg:mb-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Bộ lọc
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="Camera">Camera</option>
                  <option value="Ống kính">Ống kính</option>
                  <option value="Tripod">Tripod</option>
                  <option value="Đèn flash">Đèn flash</option>
                  <option value="Microphone">Microphone</option>
                  <option value="Gimbal">Gimbal</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khu vực
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận 2">Quận 2</option>
                  <option value="Quận 3">Quận 3</option>
                  <option value="Quận 7">Quận 7</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng giá
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="2000000"
                    step="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0đ</span>
                    <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setPriceRange([0, 2000000]);
                }}
                className="w-full text-gray-600 hover:text-orange-600 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white rounded-lg shadow-sm p-4">
              <div className="mb-4 sm:mb-0">
                <p className="text-gray-600">
                  Hiển thị {equipment.length} thiết bị
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="price-low">Giá thấp đến cao</option>
                  <option value="price-high">Giá cao đến thấp</option>
                  <option value="newest">Mới nhất</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchEquipment}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {equipment.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && equipment.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Không tìm thấy thiết bị nào phù hợp</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setPriceRange([0, 2000000]);
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

  title: string;  title: string;

  category: string;  category: string;

  pricePerDay: number;  pricePerDay: number;

  pricePerWeek?: number;  pricePerWeek?: number;

  rating?: number;  rating?: number;

  reviewCount?: number;  reviewCount?: number;

  images?: string[];  images?: string[];

  location?: {  location?: {

    address: string;    address: string;

  };  };

  availability: string;  availability: string;

}}



interface Equipment {interface Equipment {

  id: string;  id: string;

  name: string;  name: string;

  description: string;  description: string;

  dailyPrice: number;  dailyPrice: number;

  price: number; // For UI compatibility  price: number; // For UI compatibility

  category: string;  category: string;

  brand: string;  brand: string;

  condition: string;  condition: string;

  quantity: number;  quantity: number;

  imageUrl: string[];  imageUrl: string[];

  image: string; // For UI compatibility  image: string; // For UI compatibility

  location: string;  location: string;

  owner: {  owner: {

    _id: string;    _id: string;

    name: string;    name: string;

    email: string;    email: string;

  };  };

  rating: number;  rating: number;

  reviewCount: number;  reviewCount: number;

  available: boolean;  available: boolean;

}}

import Image from 'next/image';

export default function ProductsPage() {import Link from 'next/link';

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');// Hard-coded data removed - now using database

  const [priceRange, setPriceRange] = useState([0, 1000000]);export default function ProductsPage() {

  const [selectedLocation, setSelectedLocation] = useState('all');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');const categories = ['Tất cả', 'Camera', 'Ống kính', 'Tripod', 'Đèn flash', 'Microphone', 'Gimbal'];

  const [sortBy, setSortBy] = useState('rating');const locations = ['Tất cả', 'Quận 1', 'Quận 2', 'Quận 3', 'Quận 7'];

  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [loading, setLoading] = useState(true);export default function ProductsPage() {

  const [error, setError] = useState<string | null>(null);  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch equipment from database  const [priceRange, setPriceRange] = useState([0, 1000000]);

  const fetchEquipment = useCallback(async () => {  const [selectedLocation, setSelectedLocation] = useState('all');

    try {  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

      setLoading(true);  const [sortBy, setSortBy] = useState('rating');

      setError(null);  const [equipment, setEquipment] = useState<Equipment[]>([]);

        const [loading, setLoading] = useState(true);

      const params = new URLSearchParams();  const [error, setError] = useState<string | null>(null);

      if (searchQuery) params.set('q', searchQuery);

      if (selectedCategory !== 'all') params.set('category', selectedCategory);  // Fetch equipment from database

      if (selectedLocation !== 'all') params.set('location', selectedLocation);  const fetchEquipment = useCallback(async () => {

      params.set('minPrice', priceRange[0].toString());    try {

      params.set('maxPrice', priceRange[1].toString());      setLoading(true);

            setError(null);

      // Add sorting      

      if (sortBy === 'price-low') {      const params = new URLSearchParams();

        params.set('sortBy', 'pricePerDay');      if (searchQuery) params.set('q', searchQuery);

        params.set('order', 'asc');      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      } else if (sortBy === 'price-high') {      if (selectedLocation !== 'all') params.set('location', selectedLocation);

        params.set('sortBy', 'pricePerDay');      params.set('minPrice', priceRange[0].toString());

        params.set('order', 'desc');      params.set('maxPrice', priceRange[1].toString());

      } else if (sortBy === 'rating') {      

        params.set('sortBy', 'rating');      // Add sorting

        params.set('order', 'desc');      if (sortBy === 'price-low') {

      }        params.set('sortBy', 'pricePerDay');

              params.set('sortOrder', 'asc');

      const response = await fetch(`/api/equipment/search?${params.toString()}`);      } else if (sortBy === 'price-high') {

              params.set('sortBy', 'pricePerDay');

      if (response.ok) {        params.set('sortOrder', 'desc');

        const data = await response.json();      } else if (sortBy === 'rating') {

        if (data.success && data.data?.equipment) {        params.set('sortBy', 'createdAt');

          // Transform API data to match the UI structure        params.set('sortOrder', 'desc');

          const transformedData = data.data.equipment.map((item: EquipmentAPIResponse) => ({      }

            id: item.id,

            name: item.title,      const response = await fetch(`/api/equipment/search?${params.toString()}`);

            category: item.category,      

            price: item.pricePerDay,      if (response.ok) {

            dailyPrice: item.pricePerDay,        const data = await response.json();

            originalPrice: item.pricePerWeek ? Math.floor(item.pricePerWeek / 7) : undefined,        if (data.success && data.data?.equipment) {

            rating: item.rating || 4.5,          // Transform API data to match the UI structure

            reviewCount: item.reviewCount || 0,          const transformedData = data.data.equipment.map((item: EquipmentAPIResponse) => ({

            image: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',            id: item.id,

            imageUrl: item.images || [],            name: item.title,

            location: item.location?.address || 'Chưa cập nhật',            category: item.category,

            available: item.availability === 'available',            price: item.pricePerDay,

            description: '',            originalPrice: item.pricePerWeek ? Math.floor(item.pricePerWeek / 7) : undefined,

            brand: '',            rating: item.rating || 4.5,

            condition: 'good',            reviewCount: item.reviewCount || 0,

            quantity: 1,            image: item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',

            owner: {            location: item.location?.address || 'Chưa cập nhật',

              _id: '',            available: item.availability === 'available'

              name: '',          }));

              email: ''          setEquipment(transformedData);

            }        } else {

          }));          setError('Không có dữ liệu thiết bị');

          setEquipment(transformedData);          setEquipment([]);

        } else {        }

          setError('Không có dữ liệu thiết bị');      } else {

          setEquipment([]);        throw new Error('Không thể tải dữ liệu thiết bị');

        }      }

      } else {    } catch (err) {

        throw new Error('Không thể tải dữ liệu thiết bị');      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');

      }      setEquipment([]);

    } catch (err) {    } finally {

      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');      setLoading(false);

      setEquipment([]);    }

    } finally {  }, [searchQuery, selectedCategory, selectedLocation, priceRange, sortBy]);

      setLoading(false);

    }  // Load data on component mount and when filters change

  }, [searchQuery, selectedCategory, selectedLocation, priceRange, sortBy]);  useEffect(() => {

    fetchEquipment();

  // Load data on component mount and when filters change  }, [fetchEquipment]);

  useEffect(() => {

    fetchEquipment();  // Get unique categories and locations from equipment data

  }, [fetchEquipment]);  const categories = ['all', ...Array.from(new Set(equipment.map(p => p.category)))];

  const locations = ['all', ...Array.from(new Set(equipment.map(p => p.location)))];

  // Get unique categories and locations from equipment data

  const categories = ['all', ...Array.from(new Set(equipment.map(p => p.category)))];  // Filter equipment based on current filters (client-side filtering for better UX)

  const locations = ['all', ...Array.from(new Set(equipment.map(p => p.location)))];  const filteredProducts = equipment.filter(product => {

    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

  // Filter and sort equipment    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

  const filteredAndSortedEquipment = equipment    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

    .filter(product => {    const matchesLocation = selectedLocation === 'all' || product.location.includes(selectedLocation);

      const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());    

      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;    return matchesSearch && matchesCategory && matchesPrice && matchesLocation;

      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];  });

      const matchesLocation = selectedLocation === 'all' || product.location.includes(selectedLocation);

      return matchesSearch && matchesCategory && matchesPrice && matchesLocation;  // Sort products

    })  const sortedProducts = [...filteredProducts].sort((a, b) => {

    .sort((a, b) => {    switch (sortBy) {

      switch (sortBy) {      case 'price-low':

        case 'price-low':        return a.price - b.price;

          return a.price - b.price;      case 'price-high':

        case 'price-high':        return b.price - a.price;

          return b.price - a.price;      case 'rating':

        case 'rating':        return b.rating - a.rating;

          return (b.rating || 0) - (a.rating || 0);      case 'popular':

        case 'newest':      default:

          return (b.reviewCount || 0) - (a.reviewCount || 0);        return b.reviewCount - a.reviewCount;

        default:    }

          return 0;  });

      }

    });  return (

    <div className="min-h-screen">

  return (      <Header />

    <div className="min-h-screen bg-gray-50">      

      <Header />      {/* Page Header */}

            <section className="bg-gray-50 py-12">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Bar */}          <h1 className="text-3xl font-bold text-gray-900 mb-4">

        <div className="mb-8">            Thiết bị quay phim, chụp ảnh

          <div className="relative max-w-md mx-auto">          </h1>

            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />          <p className="text-lg text-gray-600">

            <input            Khám phá hàng trăm thiết bị chất lượng cao từ cộng đồng VShare

              type="text"          </p>

              placeholder="Tìm kiếm thiết bị..."        </div>

              value={searchQuery}      </section>

              onChange={(e) => setSearchQuery(e.target.value)}

              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            />        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          </div>          {/* Filters Sidebar */}

        </div>          <div className="lg:col-span-1">

            <div className="card p-6 sticky top-24">

        <div className="lg:flex lg:gap-8">              <h3 className="text-lg font-semibold mb-4 flex items-center">

          {/* Sidebar */}                <Filter className="h-5 w-5 mr-2" />

          <div className="lg:w-1/4 mb-8 lg:mb-0">                Bộ lọc

            <div className="bg-white rounded-lg shadow-sm p-6">              </h3>

              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">

                <Filter className="mr-2 h-5 w-5" />              {/* Search */}

                Bộ lọc              <div className="mb-6">

              </h3>                <label className="block text-sm font-medium text-gray-700 mb-2">

                  Tìm kiếm

              {/* Category Filter */}                </label>

              <div className="mb-6">                <div className="relative">

                <label className="block text-sm font-medium text-gray-700 mb-2">                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                  Danh mục                  <input

                </label>                    type="text"

                <select                    placeholder="Tìm thiết bị..."

                  value={selectedCategory}                    value={searchQuery}

                  onChange={(e) => setSelectedCategory(e.target.value)}                    onChange={(e) => setSearchQuery(e.target.value)}

                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"                    className="input-field pl-10"

                >                  />

                  <option value="all">Tất cả</option>                </div>

                  {categories.filter(cat => cat !== 'all').map((category) => (              </div>

                    <option key={category} value={category}>

                      {category}              {/* Category Filter */}

                    </option>              <div className="mb-6">

                  ))}                <label className="block text-sm font-medium text-gray-700 mb-2">

                </select>                  Danh mục

              </div>                </label>

                <select

              {/* Location Filter */}                  value={selectedCategory}

              <div className="mb-6">                  onChange={(e) => setSelectedCategory(e.target.value)}

                <label className="block text-sm font-medium text-gray-700 mb-2">                  className="input-field"

                  Khu vực                >

                </label>                  {categories.map((category) => (

                <select                    <option key={category} value={category}>

                  value={selectedLocation}                      {category}

                  onChange={(e) => setSelectedLocation(e.target.value)}                    </option>

                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"                  ))}

                >                </select>

                  <option value="all">Tất cả</option>              </div>

                  {locations.filter(loc => loc !== 'all').map((location) => (

                    <option key={location} value={location}>              {/* Location Filter */}

                      {location}              <div className="mb-6">

                    </option>                <label className="block text-sm font-medium text-gray-700 mb-2">

                  ))}                  Khu vực

                </select>                </label>

              </div>                <select

                  value={selectedLocation}

              {/* Price Range Filter */}                  onChange={(e) => setSelectedLocation(e.target.value)}

              <div className="mb-6">                  className="input-field"

                <label className="block text-sm font-medium text-gray-700 mb-2">                >

                  Khoảng giá                  {locations.map((location) => (

                </label>                    <option key={location} value={location}>

                <div className="space-y-2">                      {location}

                  <input                    </option>

                    type="range"                  ))}

                    min="0"                </select>

                    max="2000000"              </div>

                    step="50000"

                    value={priceRange[1]}              {/* Price Range Filter */}

                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}              <div className="mb-6">

                    className="w-full"                <label className="block text-sm font-medium text-gray-700 mb-2">

                  />                  Khoảng giá

                  <div className="flex justify-between text-sm text-gray-600">                </label>

                    <span>0đ</span>                <div className="space-y-2">

                    <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>                  <input

                  </div>                    type="range"

                </div>                    min="0"

              </div>                    max="2000000"

                    step="50000"

              {/* Clear Filters */}                    value={priceRange[1]}

              <button                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}

                onClick={() => {                    className="w-full"

                  setSearchQuery('');                  />

                  setSelectedCategory('all');                  <div className="flex justify-between text-sm text-gray-600">

                  setSelectedLocation('all');                    <span>0đ</span>

                  setPriceRange([0, 2000000]);                    <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>

                }}                  </div>

                className="w-full text-gray-600 hover:text-orange-600 transition-colors"                </div>

              >              </div>

                Xóa bộ lọc

              </button>              {/* Clear Filters */}

            </div>              <button

          </div>                onClick={() => {

                  setSearchQuery('');

          {/* Main Content */}                  setSelectedCategory('all');

          <div className="lg:w-3/4">                  setSelectedLocation('all');

            {/* Controls */}                  setPriceRange([0, 2000000]);

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white rounded-lg shadow-sm p-4">                }}

              <div className="mb-4 sm:mb-0">                className="w-full text-gray-600 hover:text-orange-600 transition-colors"

                <p className="text-gray-600">              >

                  Hiển thị {filteredAndSortedEquipment.length} thiết bị                Xóa bộ lọc

                </p>              </button>

              </div>            </div>

                        </div>

              <div className="flex items-center space-x-4">

                {/* Sort Options */}          {/* Products Grid */}

                <select          <div className="lg:col-span-3">

                  value={sortBy}            {/* Products Header */}

                  onChange={(e) => setSortBy(e.target.value)}            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">

                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"              <div className="mb-4 sm:mb-0">

                >                <p className="text-gray-600">

                  <option value="rating">Đánh giá cao nhất</option>                  Hiển thị {sortedProducts.length} trong tổng số {products.length} sản phẩm

                  <option value="price-low">Giá thấp đến cao</option>                </p>

                  <option value="price-high">Giá cao đến thấp</option>              </div>

                  <option value="newest">Mới nhất</option>              

                </select>              <div className="flex items-center space-x-4">

                {/* Sort */}

                {/* View Mode Toggle */}                <select

                <div className="flex border border-gray-200 rounded-lg">                  value={sortBy}

                  <button                  onChange={(e) => setSortBy(e.target.value)}

                    onClick={() => setViewMode('grid')}                  className="input-field w-auto"

                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}                >

                  >                  <option value="popular">Phổ biến nhất</option>

                    <Grid className="h-4 w-4" />                  <option value="rating">Đánh giá cao nhất</option>

                  </button>                  <option value="price-low">Giá thấp đến cao</option>

                  <button                  <option value="price-high">Giá cao đến thấp</option>

                    onClick={() => setViewMode('list')}                </select>

                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}

                  >                {/* View Mode */}

                    <List className="h-4 w-4" />                <div className="flex border border-gray-300 rounded-lg">

                  </button>                  <button

                </div>                    onClick={() => setViewMode('grid')}

              </div>                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}

            </div>                  >

                    <Grid className="h-4 w-4" />

            {/* Loading State */}                  </button>

            {loading && (                  <button

              <div className="text-center py-12">                    onClick={() => setViewMode('list')}

                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}

                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>                  >

              </div>                    <List className="h-4 w-4" />

            )}                  </button>

                </div>

            {/* Error State */}              </div>

            {error && (            </div>

              <div className="text-center py-12">

                <p className="text-red-600 mb-4">{error}</p>            {/* Products */}

                <button            {loading ? (

                  onClick={fetchEquipment}              <div className="flex justify-center py-12">

                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"                <div className="text-center">

                >                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>

                  Thử lại                  <p className="text-gray-600">Đang tải thiết bị...</p>

                </button>                </div>

              </div>              </div>

            )}            ) : error ? (

              <div className="text-center py-12">

            {/* Products Grid */}                <div className="text-red-400 mb-4">

            {!loading && !error && (                  <Search className="h-16 w-16 mx-auto" />

              <div className={`grid gap-6 ${                </div>

                viewMode === 'grid'                 <h3 className="text-lg font-medium text-gray-900 mb-2">

                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'                   Đã xảy ra lỗi

                  : 'grid-cols-1'                </h3>

              }`}>                <p className="text-gray-600 mb-4">

                {filteredAndSortedEquipment.map((product) => (                  {error}

                  <ProductCard key={product.id} {...product} />                </p>

                ))}                <button

              </div>                  onClick={() => fetchEquipment()}

            )}                  className="btn-primary"

                >

            {/* No Results */}                  Thử lại

            {!loading && !error && filteredAndSortedEquipment.length === 0 && (                </button>

              <div className="text-center py-12">              </div>

                <p className="text-gray-600 mb-4">Không tìm thấy thiết bị nào phù hợp</p>            ) : sortedProducts.length > 0 ? (

                <button              <div className={`grid gap-6 ${

                  onClick={() => {                viewMode === 'grid' 

                    setSearchQuery('');                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 

                    setSelectedCategory('all');                  : 'grid-cols-1'

                    setSelectedLocation('all');              }`}>

                    setPriceRange([0, 2000000]);                {sortedProducts.map((product) => (

                  }}                  <ProductCard key={product.id} {...product} />

                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"                ))}

                >              </div>

                  Xóa bộ lọc            ) : (

                </button>              <div className="text-center py-12">

              </div>                <div className="text-gray-400 mb-4">

            )}                  <Search className="h-16 w-16 mx-auto" />

          </div>                </div>

        </div>                <h3 className="text-lg font-medium text-gray-900 mb-2">

      </main>                  Không tìm thấy sản phẩm

                </h3>

      <Footer />                <p className="text-gray-600">

    </div>                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm

  );                </p>

}              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
