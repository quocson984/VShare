'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import Map from '@/components/Map';
import { User, Phone, MapPin } from 'lucide-react';

export default function DashboardProfilePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    bio: '',
    address: ''
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.8231, 106.6297]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    
    // Redirect admin/moderator to admin dashboard
    if (userData.role === 'admin' || userData.role === 'moderator') {
      router.push('/admin/customers');
      return;
    }
    
    setUser(userData);
    
    console.log('User data loaded:', userData);
    console.log('User location:', userData.location);
    
    // Extract coordinates from location object if exists
    const hasLocation = userData.location?.coordinates && Array.isArray(userData.location.coordinates);
    const lng = hasLocation ? userData.location.coordinates[0] : 0;
    const lat = hasLocation ? userData.location.coordinates[1] : 0;
    
    console.log('Extracted coordinates - lat:', lat, 'lng:', lng);
    
    setFormData({
      fullname: userData.fullname || '',
      phone: userData.phone || '',
      bio: userData.bio || '',
      address: userData.location?.address || ''
    });
    setAvatarPreview(userData.avatar || '');
    
    // Set initial map location if user has coordinates
    if (lat && lng && lat !== 0 && lng !== 0) {
      console.log('Setting map center and selected location to:', [lat, lng]);
      const latLngArray: [number, number] = [lat, lng];
      setMapCenter(latLngArray);
      setSelectedLocation(latLngArray);
    } else {
      console.log('No valid coordinates found, using default location');
    }
    
    setLoading(false);
    // Delay to ensure map renders properly with markers
    setTimeout(() => setMapReady(true), 300);
  }, [router]);

  // Update map when user location changes (after profile update)
  useEffect(() => {
    if (user?.location?.coordinates && Array.isArray(user.location.coordinates) && mapReady) {
      const lng = user.location.coordinates[0];
      const lat = user.location.coordinates[1];
      if (lat && lng && lat !== 0 && lng !== 0) {
        console.log('User location changed, updating map to:', [lat, lng]);
        const latLngArray: [number, number] = [lat, lng];
        setMapCenter(latLngArray);
        setSelectedLocation(latLngArray);
      }
    }
  }, [user?.location, mapReady]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 32MB)
    if (file.size > 32 * 1024 * 1024) {
      alert('Ảnh quá lớn (max 32MB)');
      return;
    }

    setAvatarFile(file);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to ImgBB
    try {
      const formData = new FormData();
      formData.append('image', file);

      const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'adff3abaf78ebaa6413008156d63d754';
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const avatarUrl = result.data.display_url || result.data.url;
        
        // Update user profile with new avatar URL immediately
        const userId = user?._id || user?.id;
        if (userId) {
          const updateResponse = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              avatar: avatarUrl
            })
          });

          const updateData = await updateResponse.json();
          if (updateData.success) {
            // Update localStorage
            const updatedUser = { ...user, avatar: avatarUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert('Cập nhật ảnh đại diện thành công!');
          }
        }
      } else {
        alert('Lỗi upload ảnh: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Lỗi kết nối khi upload ảnh');
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = user?._id || user?.id;
    if (!userId) {
      alert('User ID not found. Please login again.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      // Prepare location data if coordinates are selected
      const locationData = selectedLocation ? {
        type: 'Point',
        coordinates: [selectedLocation[1], selectedLocation[0]], // [lng, lat]
        address: formData.address
      } : undefined;

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          fullname: formData.fullname,
          phone: formData.phone,
          bio: formData.bio,
          ...(locationData && { location: locationData })
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update localStorage with new user data
        const updatedUser = {
          ...user,
          ...data.data
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setSuccessMessage('Cập nhật hồ sơ thành công!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Lỗi kết nối server');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header hideSearch={true} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Hồ sơ của tôi</h1>

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                    {(avatarPreview || user.avatar) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarPreview || user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-orange-600" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-orange-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-orange-700">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <User className="h-4 w-4" />
                  </label>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.fullname || 'Người dùng'}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    {/* Credit Badge */}
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                      (user.credit === 'trusted' || !user.credit) ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {(user.credit === 'trusted' || !user.credit) ? 'Uy tín' : 'Hạn chế'}
                    </span>
                    {/* Status Badge */}
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'unverified' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Đã xác minh' : 
                       user.status === 'unverified' ? 'Chưa xác minh' : 
                       'Bị khóa'}
                    </span>
                  </div>
                </div>
              </div>
              
              {user.status === 'unverified' && (
                <Link
                  href="/verify"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Bắt đầu xác thực
                </Link>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
              <div className="flex items-center gap-3">
                {successMessage && (
                  <span className="text-green-600 text-sm font-medium">{successMessage}</span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fullname */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Giới thiệu bản thân
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Viết vài dòng giới thiệu về bản thân..."
                />
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>

              {/* Map */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  Vị trí trên bản đồ
                </label>
                <p className="text-xs text-gray-500 mb-2">Nhấp vào bản đồ để chọn vị trí của bạn</p>
                <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300">
                  {mapReady && (
                    <Map
                      key={mapKey}
                      center={mapCenter}
                      zoom={13}
                      markers={selectedLocation ? [{
                        id: 'user-location',
                        position: selectedLocation,
                        title: 'Vị trí của tôi',
                        description: formData.address || 'Vị trí đã chọn'
                      }] : []}
                      onLocationSelect={(lat, lng) => {
                        console.log('Map clicked at:', [lat, lng]);
                        setSelectedLocation([lat, lng]);
                      }}
                    />
                  )}
                  {!mapReady && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                        <span>Đang tải bản đồ...</span>
                      </div>
                    </div>
                  )}
                </div>
                {selectedLocation && (
                  <p className="text-xs text-gray-500 mt-2">
                    Tọa độ đã chọn: {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
