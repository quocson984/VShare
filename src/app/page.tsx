import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Camera, Video, Lightbulb, Shield, Clock, Star, Users, Minus } from 'lucide-react';
import Link from 'next/link';

// Mock data for featured products
const featuredProducts = [
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
  }
];

const categories = [
  { name: 'Camera', icon: Camera, count: 156, color: 'bg-blue-500' },
  { name: 'Ống kính', icon: Video, count: 89, color: 'bg-green-500' },
  { name: 'Tripod', icon: Minus, count: 67, color: 'bg-purple-500' },
  { name: 'Đèn flash', icon: Lightbulb, count: 43, color: 'bg-yellow-500' },
  { name: 'Microphone', icon: Video, count: 34, color: 'bg-red-500' },
  { name: 'Gimbal', icon: Video, count: 28, color: 'bg-indigo-500' }
];

const features = [
  {
    icon: Shield,
    title: 'Bảo hiểm toàn diện',
    description: 'Tất cả thiết bị đều được bảo hiểm trong quá trình thuê'
  },
  {
    icon: Clock,
    title: 'Giao hàng nhanh chóng',
    description: 'Giao hàng trong vòng 2-4 giờ tại TP.HCM'
  },
  {
    icon: Star,
    title: 'Chất lượng đảm bảo',
    description: 'Tất cả thiết bị đều được kiểm tra kỹ lưỡng trước khi cho thuê'
  },
  {
    icon: Users,
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ hỗ trợ khách hàng chuyên nghiệp'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Thuê thiết bị quay phim, chụp ảnh chuyên nghiệp
              </h1>
              <p className="text-xl mb-8 text-orange-100">
                Kết nối người thuê và cho thuê thiết bị quay phim, chụp ảnh. 
                An toàn, tiện lợi và đáng tin cậy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/equipments" className="btn-secondary text-center">
                  Khám phá thiết bị
                </Link>
                <Link href="/register" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center">
                  Đăng ký cho thuê
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <Camera className="h-32 w-32 mx-auto text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Danh mục thiết bị
            </h2>
            <p className="text-lg text-gray-600">
              Chọn từ hàng trăm thiết bị chất lượng cao
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/equipments?category=${category.name}`}
                className="card p-6 text-center hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} thiết bị</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Thiết bị nổi bật
              </h2>
              <p className="text-lg text-gray-600">
                Những thiết bị được thuê nhiều nhất
              </p>
            </div>
            <Link href="/equipments" className="btn-primary">
              Xem tất cả
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Tại sao chọn VShare?
            </h2>
            <p className="text-lg text-gray-300">
              Chúng tôi cam kết mang đến trải nghiệm thuê thiết bị tốt nhất
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Tham gia cộng đồng VShare ngay hôm nay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-secondary">
              Đăng ký ngay
            </Link>
            <Link href="/equipments" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
              Khám phá thiết bị
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
