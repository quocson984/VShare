'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Search, Filter, Grid, List, Star } from 'lucide-react';

// Mock data for products
const products = [
  {
    id: '1',
    name: 'Canon EOS R5 Mirrorless Camera',
    category: 'Camera',
    price: 500000,
    originalPrice: 600000,
    rating: 4.8,
    reviewCount: 124,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    location: 'Quận 1, TP.HCM',
    available: true
  },
  {
    id: '2',
    name: 'Sony FE 24-70mm f/2.8 GM Lens',
    category: 'Ống kính',
    price: 300000,
    rating: 4.9,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
    location: 'Quận 3, TP.HCM',
    available: true
  },
  {
    id: '3',
    name: 'Manfrotto MT055XPRO3 Tripod',
    category: 'Tripod',
    price: 150000,
    rating: 4.7,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop',
    location: 'Quận 7, TP.HCM',
    available: true
  },
  {
    id: '4',
    name: 'Godox AD600 Pro Flash',
    category: 'Đèn flash',
    price: 200000,
    originalPrice: 250000,
    rating: 4.6,
    reviewCount: 42,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    location: 'Quận 2, TP.HCM',
    available: false
  },
  {
    id: '5',
    name: 'DJI RS 3 Pro Gimbal',
    category: 'Gimbal',
    price: 350000,
    rating: 4.9,
    reviewCount: 78,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    location: 'Quận 1, TP.HCM',
    available: true
  },
  {
    id: '6',
    name: 'Rode NTG5 Shotgun Microphone',
    category: 'Microphone',
    price: 180000,
    rating: 4.7,
    reviewCount: 34,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    location: 'Quận 3, TP.HCM',
    available: true
  },
  {
    id: '7',
    name: 'Nikon Z6 II Mirrorless Camera',
    category: 'Camera',
    price: 450000,
    rating: 4.8,
    reviewCount: 95,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    location: 'Quận 7, TP.HCM',
    available: true
  },
  {
    id: '8',
    name: 'Canon RF 70-200mm f/2.8 Lens',
    category: 'Ống kính',
    price: 400000,
    originalPrice: 450000,
    rating: 4.9,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
    location: 'Quận 2, TP.HCM',
    available: true
  }
];

const categories = ['Tất cả', 'Camera', 'Ống kính', 'Tripod', 'Đèn flash', 'Microphone', 'Gimbal'];
const locations = ['Tất cả', 'Quận 1', 'Quận 2', 'Quận 3', 'Quận 7'];
const priceRanges = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: 'Dưới 200k', min: 0, max: 200000 },
  { label: '200k - 400k', min: 200000, max: 400000 },
  { label: '400k - 600k', min: 400000, max: 600000 },
  { label: 'Trên 600k', min: 600000, max: Infinity }
];

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
    const matchesLocation = selectedLocation === 'Tất cả' || product.location.includes(selectedLocation);
    const matchesPrice = product.price >= priceRanges[selectedPriceRange].min && 
                        product.price <= priceRanges[selectedPriceRange].max;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.reviewCount - a.reviewCount;
    }
  });

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Page Header */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thiết bị quay phim, chụp ảnh
          </h1>
          <p className="text-lg text-gray-600">
            Khám phá hàng trăm thiết bị chất lượng cao từ cộng đồng VShare
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Bộ lọc
              </h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm thiết bị..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
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
                  className="input-field"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng giá
                </label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(Number(e.target.value))}
                  className="input-field"
                >
                  {priceRanges.map((range, index) => (
                    <option key={index} value={index}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Tất cả');
                  setSelectedLocation('Tất cả');
                  setSelectedPriceRange(0);
                }}
                className="w-full text-gray-600 hover:text-orange-600 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Products Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="mb-4 sm:mb-0">
                <p className="text-gray-600">
                  Hiển thị {sortedProducts.length} trong tổng số {products.length} sản phẩm
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field w-auto"
                >
                  <option value="popular">Phổ biến nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="price-low">Giá thấp đến cao</option>
                  <option value="price-high">Giá cao đến thấp</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {sortedProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-600">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
