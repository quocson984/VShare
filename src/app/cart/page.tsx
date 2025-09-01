'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trash2, Calendar, MapPin, CreditCard, Shield } from 'lucide-react';
import Image from 'next/image';

// Mock cart data
const cartItems = [
  {
    id: '1',
    name: 'Canon EOS R5 Mirrorless Camera',
    category: 'Camera',
    price: 500000,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
    location: 'Quận 1, TP.HCM',
    days: 3
  },
  {
    id: '2',
    name: 'Sony FE 24-70mm f/2.8 GM Lens',
    category: 'Ống kính',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
    location: 'Quận 3, TP.HCM',
    days: 3
  }
];

const insuranceOptions = [
  { id: 'basic', name: 'Bảo hiểm cơ bản', price: 50000, coverage: 'Bảo hiểm 50% giá trị thiết bị' },
  { id: 'premium', name: 'Bảo hiểm cao cấp', price: 100000, coverage: 'Bảo hiểm 100% giá trị thiết bị' },
  { id: 'none', name: 'Không bảo hiểm', price: 0, coverage: 'Không có bảo hiểm' }
];

export default function CartPage() {
  const [items, setItems] = useState(cartItems);
  const [selectedInsurance, setSelectedInsurance] = useState('basic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idCard: ''
  });

  const updateItemDays = (id: string, days: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, days: Math.max(1, days) } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.days), 0);
  const insurancePrice = insuranceOptions.find(opt => opt.id === selectedInsurance)?.price || 0;
  const deliveryFee = 50000; // Fixed delivery fee
  const total = subtotal + insurancePrice + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle checkout logic here
    console.log('Checkout:', { items, customerInfo, selectedInsurance, total });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Shield className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <a href="/products" className="btn-primary">
              Tiếp tục mua sắm
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Sản phẩm đã chọn</h2>
              </div>
              
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">{item.location}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {item.price.toLocaleString('vi-VN')}đ/ngày
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <label className="text-sm text-gray-600">Số ngày:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.days}
                            onChange={(e) => updateItemDays(item.id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <p className="text-lg font-bold text-orange-600 mt-2">
                          {(item.price * item.days).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Thông tin thuê</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Ngày thuê
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Từ ngày</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Đến ngày</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      className="input-field"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CMND/CCCD
                    </label>
                    <input
                      type="text"
                      value={customerInfo.idCard}
                      onChange={(e) => setCustomerInfo({...customerInfo, idCard: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Insurance Options */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Gói bảo hiểm
                  </h3>
                  <div className="space-y-2">
                    {insuranceOptions.map((option) => (
                      <label key={option.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="insurance"
                          value={option.id}
                          checked={selectedInsurance === option.id}
                          onChange={(e) => setSelectedInsurance(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-orange-600 font-semibold">
                              {option.price.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{option.coverage}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí bảo hiểm:</span>
                      <span>{insurancePrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí giao hàng:</span>
                      <span>{deliveryFee.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Tổng cộng:</span>
                        <span className="text-orange-600">{total.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  type="submit"
                  className="w-full btn-primary py-3 text-lg"
                >
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  Thanh toán
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
