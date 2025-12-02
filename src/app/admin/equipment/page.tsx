'use client';

import { useEffect, useState } from 'react';
import { Search, Package, Eye, X } from 'lucide-react';
import Image from 'next/image';

interface Equipment {
  _id: string;
  name: string;
  brand?: string;
  model?: string;
  category: string;
  pricePerDay: number;
  images: string[];
  status: string;
  ownerId: {
    _id: string;
    fullname?: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/admin/equipment');
      const data = await response.json();
      if (data.success) {
        setEquipment(data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ownerId?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(equipment.map(item => item.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Thiết bị</h1>
      </div>

      <div className="p-8">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng thiết bị</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{equipment.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Sẵn sàng</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {equipment.filter(e => e.status === 'available').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Đang thuê</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {equipment.filter(e => e.status === 'rented').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Không khả dụng</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {equipment.filter(e => e.status === 'unavailable').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Sẵn sàng</option>
            <option value="rented">Đang thuê</option>
            <option value="unavailable">Không khả dụng</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              {item.images?.[0] ? (
                <Image
                  src={item.images[0]}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.brand && (
                <p className="text-sm text-gray-600 mb-1">{item.brand} {item.model}</p>
              )}
              <p className="text-sm text-gray-500 mb-2">{item.category}</p>
              <p className="text-lg font-bold text-blue-600 mb-3">
                {item.pricePerDay.toLocaleString('vi-VN')}đ/ngày
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.status === 'available' ? 'bg-green-100 text-green-700' :
                  item.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.status === 'available' ? 'Sẵn sàng' :
                   item.status === 'rented' ? 'Đang thuê' : 'Không khả dụng'}
                </span>
                
                <button
                  onClick={() => setSelectedEquipment(item)}
                  className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Chi tiết
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Chủ sở hữu: {item.ownerId?.fullname || item.ownerId?.email}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg min-w-[600px] max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết thiết bị</h2>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Images */}
              {selectedEquipment.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {selectedEquipment.images.slice(0, 3).map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <Image
                        src={img}
                        alt={`${selectedEquipment.name} ${idx + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEquipment.name}</h3>
                  {selectedEquipment.brand && (
                    <p className="text-gray-600">{selectedEquipment.brand} {selectedEquipment.model}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <p className="text-gray-900">{selectedEquipment.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê</label>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedEquipment.pricePerDay.toLocaleString('vi-VN')}đ/ngày
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEquipment.status === 'available' ? 'bg-green-100 text-green-700' :
                      selectedEquipment.status === 'rented' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedEquipment.status === 'available' ? 'Sẵn sàng' :
                       selectedEquipment.status === 'rented' ? 'Đang thuê' : 'Không khả dụng'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">
                      {new Date(selectedEquipment.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Thông tin chủ sở hữu</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-gray-900">
                      <span className="font-medium">Tên:</span> {selectedEquipment.ownerId?.fullname || 'N/A'}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">Email:</span> {selectedEquipment.ownerId?.email}
                    </p>
                    <p className="text-gray-900">
                      <span className="font-medium">SĐT:</span> {selectedEquipment.ownerId?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
