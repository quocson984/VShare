'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone } from 'lucide-react';

export default function AdminProfilePage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullname: '',
    phone: ''
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    
    // Only allow admin/moderator
    if (userData.role !== 'admin' && userData.role !== 'moderator') {
      router.push('/dashboard/profile');
      return;
    }
    
    setUser(userData);
    setFormData({
      fullname: userData.fullname || '',
      phone: userData.phone || ''
    });
    setAvatarPreview(userData.avatar || '');
    setLoading(false);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          fullname: formData.fullname,
          phone: formData.phone
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ của tôi</h1>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'admin' ? 'Quản trị viên' : 'Người kiểm duyệt'}
              </span>
            </div>
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
          </form>
        </div>
      </div>
    </>
  );
}
