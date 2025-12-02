'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  MapPin, 
  DollarSign, 
  Package, 
  Tag,
  Plus,
  X,
  Save
} from 'lucide-react';
import Image from 'next/image';

interface Spec {
  name: string;
  value: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface EquipmentUploadFormProps {
  onSuccess?: () => void;
  equipmentId?: string;
}

export default function EquipmentUploadForm({ onSuccess, equipmentId }: EquipmentUploadFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    description: '',
    category: '',
    quantity: 1,
    serialNumbers: [] as string[],
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    replacementPrice: '',
    status: 'available'
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [accountAddress, setAccountAddress] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const categories = [
    { value: 'camera', label: 'Máy ảnh' },
    { value: 'lens', label: 'Ống kính' },
    { value: 'lighting', label: 'Ánh sáng' },
    { value: 'audio', label: 'Âm thanh' },
    { value: 'accessory', label: 'Phụ kiện' }
  ];

  // Load account address
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setAccountAddress(userData.address || '');
    }
  }, []);

  // Load equipment data for editing
  useEffect(() => {
    if (equipmentId) {
      loadEquipmentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId]);

  const loadEquipmentData = async () => {
    try {
      console.log('Loading equipment:', equipmentId);
      
      // Get viewer ID to allow owner to edit unavailable equipment
      const userStr = localStorage.getItem('user');
      const accountId = localStorage.getItem('accountId');
      const viewerId = accountId || (userStr ? JSON.parse(userStr)._id : null);
      
      const url = viewerId 
        ? `/api/equipment/${equipmentId}?viewerId=${viewerId}`
        : `/api/equipment/${equipmentId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('Equipment data received:', data);
      
      if (data.success && data.equipment) {
        const eq = data.equipment;
        console.log('Setting form data with:', eq);
        setFormData({
          title: eq.title || '',
          brand: eq.brand || '',
          description: eq.description || '',
          category: eq.category || '',
          quantity: eq.quantity || 1,
          serialNumbers: eq.serialNumbers || [],
          pricePerDay: eq.prices?.perDay?.toString() || eq.pricePerDay?.toString() || '',
          pricePerWeek: eq.prices?.perWeek?.toString() || eq.pricePerWeek?.toString() || '',
          pricePerMonth: eq.prices?.perMonth?.toString() || eq.pricePerMonth?.toString() || '',
          replacementPrice: eq.replacementPrice?.toString() || '',
          status: eq.status || 'available'
        });
        const imageUrls = eq.images || [];
        console.log('Loading images:', imageUrls);
        setImagePreviews(imageUrls);
        setSpecs(eq.specs || []);
        setSerialInput((eq.serialNumbers || []).join('\n'));
      } else {
        console.error('Failed to load equipment:', data);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle price fields - allow only numbers and format with dots
    if (['pricePerDay', 'pricePerWeek', 'pricePerMonth', 'replacementPrice'].includes(name)) {
      // Remove all non-digit characters
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else if (type === 'checkbox' && name === 'status') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        status: checked ? 'available' : 'unavailable'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Format number with dots for display
  const formatCurrency = (value: string) => {
    if (!value) return '';
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle serial numbers
  const handleSerialNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSerialInput(value);
    // Split by comma or newline, trim each serial
    const serials = value.split(/[,\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    console.log('Serial input:', value, 'Parsed serials:', serials);
    setFormData(prev => ({
      ...prev,
      serialNumbers: serials
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    console.log('Starting image upload, files:', files.length);
    setIsLoading(true);
    
    // Upload images to ImgBB
    const uploadedUrls: string[] = [];
    const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'adff3abaf78ebaa6413008156d63d754';
    
    for (const file of files) {
      try {
        // Validate file size (max 32MB)
        if (file.size > 32 * 1024 * 1024) {
          showToast(`Ảnh ${file.name} quá lớn (max 32MB)`, 'error');
          continue;
        }

        const imageFormData = new FormData();
        imageFormData.append('image', file);

        console.log('Uploading image:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
          method: 'POST',
          body: imageFormData
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error:', response.status, errorText);
          showToast(`Lỗi HTTP ${response.status} khi upload ${file.name}`, 'error');
          continue;
        }

        const result = await response.json();
        console.log('ImgBB response:', result);
        
        if (result.success && result.data) {
          const imageUrl = result.data.display_url || result.data.url;
          uploadedUrls.push(imageUrl);
          console.log('Image uploaded successfully:', imageUrl);
        } else {
          const errorMsg = result.error?.message || result.status_txt || 'Unknown error';
          console.error('ImgBB upload failed:', result);
          showToast(`Lỗi upload ảnh ${file.name}: ${errorMsg}`, 'error');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        showToast(`Lỗi kết nối khi upload ảnh ${file.name}: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
      }
    }
    
    console.log('Total uploaded URLs:', uploadedUrls.length, uploadedUrls);
    
    if (uploadedUrls.length > 0) {
      setImages([...images, ...files.slice(0, uploadedUrls.length)]);
      setImagePreviews([...imagePreviews, ...uploadedUrls]);
    }
    
    setIsLoading(false);
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addSpec = () => {
    setSpecs(prev => [...prev, { name: '', value: '' }]);
  };

  const updateSpec = (index: number, field: 'name' | 'value', value: string) => {
    setSpecs(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const removeSpec = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề thiết bị là bắt buộc';
    }

    if (!formData.category) {
      newErrors.category = 'Danh mục là bắt buộc';
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'Số lượng phải ít nhất là 1';
    }

    console.log('Validating serials - quantity:', formData.quantity, typeof formData.quantity, 'serials:', formData.serialNumbers.length);
    
    if (formData.serialNumbers.length === 0) {
      newErrors.serialNumbers = 'Vui lòng nhập số serial';
    } else if (Number(formData.quantity) !== formData.serialNumbers.length) {
      newErrors.serialNumbers = `Cần có đúng ${formData.quantity} số serial (hiện có ${formData.serialNumbers.length})`;
    }

    if (!formData.pricePerDay || parseInt(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = 'Giá thuê theo ngày phải lớn hơn 0';
    }

    if (!formData.replacementPrice || parseInt(formData.replacementPrice) <= 0) {
      newErrors.replacementPrice = 'Giá thay thế phải lớn hơn 0';
    }

    if (imagePreviews.length === 0) {
      newErrors.images = 'Cần ít nhất một hình ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Submit - formData:', formData);
    console.log('Submit - serialInput:', serialInput);
    console.log('Submit - serialNumbers:', formData.serialNumbers);

    if (!validateForm()) {
      console.log('Validation failed, errors:', errors);
      return;
    }

    setIsLoading(true);

    try {
      const accountId = localStorage.getItem('accountId');
      if (!accountId) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const submitData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'serialNumbers') {
          submitData.append(key, JSON.stringify(value));
        } else if (['pricePerDay', 'pricePerWeek', 'pricePerMonth', 'replacementPrice'].includes(key)) {
          // Convert string to number for prices
          submitData.append(key, value ? parseInt(value as string).toString() : '0');
        } else {
          submitData.append(key, value.toString());
        }
      });

      // Add uploaded image URLs
      submitData.append('images', JSON.stringify(imagePreviews));

      // Add specs
      submitData.append('specs', JSON.stringify(specs));
      submitData.append('ownerId', accountId);

      const url = equipmentId 
        ? `/api/equipment/${equipmentId}` 
        : '/api/equipment/upload';
      
      const response = await fetch(url, {
        method: equipmentId ? 'PUT' : 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Tải lên thất bại');
      }

      if (result.success) {
        showToast(equipmentId 
          ? 'Cập nhật thiết bị thành công!' 
          : 'Tải lên thiết bị thành công! Thiết bị sẽ được admin xem xét trước khi hiển thị.', 'success');
        
        // Reset form only for create mode
        if (!equipmentId) {
          setFormData({
            title: '',
            brand: '',
            description: '',
            category: '',
            quantity: 1,
            serialNumbers: [],
            pricePerDay: '',
            pricePerWeek: '',
            pricePerMonth: '',
            replacementPrice: '',
            status: 'available'
          });
          setImages([]);
          setImagePreviews([]);
          setSpecs([]);
          setSerialInput('');
          setErrors({});
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          // For edit mode, just clear errors
          setErrors({});
        }
      } else {
        throw new Error(result.message || 'Tải lên thất bại');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrors({ submit: error.message || 'Tải lên thất bại' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Package className="h-4 w-4 inline mr-1" />
                Tên thiết bị *
              </label>
              {equipmentId && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 'available'}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Hiển thị
                  </label>
                </div>
              )}
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ví dụ: Máy ảnh Canon EOS R5"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thương hiệu
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ví dụ: Canon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Danh mục *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          </div>

          {/* Serial Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số serial (mỗi dòng hoặc ngăn cách bằng dấu phẩy) *
            </label>
            <textarea
              value={serialInput}
              onChange={handleSerialNumbersChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.serialNumbers ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`Nhập ${formData.quantity} số serial, mỗi số một dòng`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Đã nhập: {formData.serialNumbers.length}/{formData.quantity}
              {formData.serialNumbers.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  [{formData.serialNumbers.join(', ')}]
                </span>
              )}
            </p>
            {errors.serialNumbers && <p className="mt-1 text-sm text-red-600">{errors.serialNumbers}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Mô tả về thiết bị của bạn..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê theo ngày (VND)*
              </label>
              <input
                type="text"
                name="pricePerDay"
                value={formatCurrency(formData.pricePerDay)}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.pricePerDay ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100.000"
              />
              {errors.pricePerDay && <p className="mt-1 text-sm text-red-600">{errors.pricePerDay}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê theo tuần
              </label>
              <input
                type="text"
                name="pricePerWeek"
                value={formatCurrency(formData.pricePerWeek)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="600.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê theo tháng
              </label>
              <input
                type="text"
                name="pricePerMonth"
                value={formatCurrency(formData.pricePerMonth)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="2.000.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thay thế *
              </label>
              <input
                type="text"
                name="replacementPrice"
                value={formatCurrency(formData.replacementPrice)}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.replacementPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50.000.000"
              />
              {errors.replacementPrice && <p className="mt-1 text-sm text-red-600">{errors.replacementPrice}</p>}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="h-4 w-4 inline mr-1" />
              Hình ảnh thiết bị *
            </label>
            {errors.images && <p className="mb-2 text-sm text-red-600">{errors.images}</p>}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />

            {/* Image Previews Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full rounded-lg object-cover"
                    onError={(e) => {
                      console.error('Image load error:', preview);
                      e.currentTarget.src = 'https://via.placeholder.com/200?text=Error';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {/* Upload button positioned after images */}
              <label
                htmlFor="image-upload"
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-600 text-center px-2">Thêm ảnh</span>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-4">
              </div>
            )}
          </div>

          {/* Specifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Thông số kỹ thuật
              </label>
              <button
                type="button"
                onClick={addSpec}
                className="flex items-center text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm thông số
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((spec, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Tên thông số"
                    value={spec.name}
                    onChange={(e) => updateSpec(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Giá trị"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {equipmentId ? 'Lưu thay đổi' : 'Tải lên thiết bị'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] px-4 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-green-500' 
                : toast.type === 'error' 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button
                onClick={() => setToasts(toasts.filter(t => t.id !== toast.id))}
                className="ml-4 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
