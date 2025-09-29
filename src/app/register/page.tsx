'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Camera,
  MapPin, CreditCard, FileText, Upload
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Stage 1: Basic Authentication
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'renter',
    agreeToTerms: false
  });

  // Stage 2: Personal Information
  const [personalData, setPersonalData] = useState({
    fullname: '',
    phone: '',
    address: ''
  });

  // Stage 3: Identity Verification
  const [identityData, setIdentityData] = useState({
    frontCccd: null as string | null,
    backCccd: null as string | null,
    selfie: null as string | null,
    identityNumber: '',
    identityFullname: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form data for each stage
  const validateStage1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!authData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(authData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!authData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (authData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!authData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (authData.password !== authData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!authData.agreeToTerms) {
      newErrors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStage2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!personalData.fullname.trim()) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }

    if (!personalData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(personalData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!personalData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStage3 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!identityData.frontCccd) {
      newErrors.frontCccd = 'Ảnh mặt trước CCCD/CMND là bắt buộc';
    }

    if (!identityData.backCccd) {
      newErrors.backCccd = 'Ảnh mặt sau CCCD/CMND là bắt buộc';
    }

    if (!identityData.selfie) {
      newErrors.selfie = 'Ảnh chân dung là bắt buộc';
    }

    if (!identityData.identityNumber.trim()) {
      newErrors.identityNumber = 'Số CCCD/CMND là bắt buộc';
    }

    if (!identityData.identityFullname.trim()) {
      newErrors.identityFullname = 'Họ tên trên CCCD/CMND là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for each stage
  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStage1()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call - in production, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store data in localStorage to persist across tabs
      localStorage.setItem('authData', JSON.stringify(authData));

      // Move to next tab
      setActiveTab(2);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStage2()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store data in localStorage
      localStorage.setItem('personalData', JSON.stringify(personalData));

      // Move to next tab
      setActiveTab(3);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStage3Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStage3()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store data in localStorage
      localStorage.setItem('identityData', JSON.stringify(identityData));

      // In a real app, here we would submit all data to the backend
      const storedAuthData = localStorage.getItem('authData');
      const storedPersonalData = localStorage.getItem('personalData');

      if (storedAuthData && storedPersonalData) {
        const combinedData = {
          ...JSON.parse(storedAuthData),
          ...JSON.parse(storedPersonalData),
          ...identityData
        };

        console.log('Submitting registration data:', combinedData);

        // Mock successful API call
        localStorage.setItem('accountId', 'mock-account-id-123');
      }

      // Redirect to verification status page
      router.push('/verify');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'frontCccd' | 'backCccd' | 'selfie'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader to convert file to data URL
    const reader = new FileReader();
    reader.onload = () => {
      setIdentityData(prev => ({
        ...prev,
        [field]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    stage: number
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    if (stage === 1) {
      setAuthData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (stage === 2) {
      setPersonalData(prev => ({ ...prev, [name]: value }));
    } else if (stage === 3) {
      setIdentityData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <Camera className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Đăng ký tài khoản VShare
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hoặc{' '}
              <Link href="/login" className="font-medium text-orange-600 hover:text-orange-500">
                đăng nhập nếu đã có tài khoản
              </Link>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab(1)}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 1
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              1. Tài khoản
            </button>
            <button
              onClick={() => activeTab >= 2 && setActiveTab(2)}
              disabled={activeTab < 2}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab < 2
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : activeTab === 2
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              2. Thông tin cá nhân
            </button>
            <button
              onClick={() => activeTab >= 3 && setActiveTab(3)}
              disabled={activeTab < 3}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab < 3
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : activeTab === 3
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              3. Xác minh danh tính
            </button>
          </div>

          {/* Tab Content */}
          <div className="card">
            {/* Stage 1: Account Information */}
            {activeTab === 1 && (
              <form className="p-8 space-y-6" onSubmit={handleStage1Submit}>
                {errors.submit && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-md">{errors.submit}</div>
                )}

                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Loại tài khoản
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="renter"
                        checked={authData.userType === 'renter'}
                        onChange={(e) => handleInputChange(e, 1)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg text-center transition-colors ${authData.userType === 'renter'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}>
                        <div className="font-medium">Người thuê</div>
                        <div className="text-sm text-gray-600">Thuê thiết bị</div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="userType"
                        value="owner"
                        checked={authData.userType === 'owner'}
                        onChange={(e) => handleInputChange(e, 1)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg text-center transition-colors ${authData.userType === 'owner'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}>
                        <div className="font-medium">Người cho thuê</div>
                        <div className="text-sm text-gray-600">Cho thuê thiết bị</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={authData.email}
                    onChange={(e) => handleInputChange(e, 1)}
                    className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập email của bạn"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={authData.password}
                      onChange={(e) => handleInputChange(e, 1)}
                      className={`input-field pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Tạo mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={authData.confirmPassword}
                      onChange={(e) => handleInputChange(e, 1)}
                      className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={authData.agreeToTerms}
                      onChange={(e) => handleInputChange(e, 1)}
                      className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <div className="text-sm">
                      <span className="text-gray-900">
                        Tôi đồng ý với{' '}
                        <Link href="/terms" className="text-orange-600 hover:text-orange-500">
                          Điều khoản sử dụng
                        </Link>
                        {' '}và{' '}
                        <Link href="/privacy" className="text-orange-600 hover:text-orange-500">
                          Chính sách bảo mật
                        </Link>
                      </span>
                      {errors.agreeToTerms && (
                        <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                      )}
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      'Tiếp tục'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Stage 2: Personal Information */}
            {activeTab === 2 && (
              <form className="p-8 space-y-6" onSubmit={handleStage2Submit}>
                {errors.submit && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-md">{errors.submit}</div>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Họ và tên
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    autoComplete="name"
                    required
                    value={personalData.fullname}
                    onChange={(e) => handleInputChange(e, 2)}
                    className={`input-field ${errors.fullname ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập họ tên đầy đủ"
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Số điện thoại
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={personalData.phone}
                    onChange={(e) => handleInputChange(e, 2)}
                    className={`input-field ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Địa chỉ
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={personalData.address}
                    onChange={(e) => handleInputChange(e, 2)}
                    className={`input-field ${errors.address ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Nhập địa chỉ đầy đủ"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* Nav Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      'Tiếp tục'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Stage 3: Identity Verification */}
            {activeTab === 3 && (
              <form className="p-8 space-y-6" onSubmit={handleStage3Submit}>
                {errors.submit && (
                  <div className="p-4 bg-red-100 text-red-700 rounded-md">{errors.submit}</div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Front CCCD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Mặt trước CCCD/CMND
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative aspect-square">
                      {identityData.frontCccd ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={identityData.frontCccd}
                            alt="Mặt trước CCCD"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setIdentityData(prev => ({ ...prev, frontCccd: null }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                          <Upload className="h-10 w-10 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">
                            Tải lên ảnh mặt trước
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'frontCccd')}
                          />
                        </label>
                      )}
                    </div>
                    {errors.frontCccd && (
                      <p className="mt-1 text-sm text-red-600">{errors.frontCccd}</p>
                    )}
                  </div>

                  {/* Back CCCD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Mặt sau CCCD/CMND
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative aspect-square">
                      {identityData.backCccd ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={identityData.backCccd}
                            alt="Mặt sau CCCD"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setIdentityData(prev => ({ ...prev, backCccd: null }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                          <Upload className="h-10 w-10 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">
                            Tải lên ảnh mặt sau
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'backCccd')}
                          />
                        </label>
                      )}
                    </div>
                    {errors.backCccd && (
                      <p className="mt-1 text-sm text-red-600">{errors.backCccd}</p>
                    )}
                  </div>

                  {/* Selfie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Camera className="h-4 w-4 inline mr-1" />
                      Ảnh chân dung
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative aspect-square">
                      {identityData.selfie ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={identityData.selfie}
                            alt="Ảnh chân dung"
                            fill
                            style={{ objectFit: 'contain' }}
                            className="rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setIdentityData(prev => ({ ...prev, selfie: null }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer">
                          <Camera className="h-10 w-10 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">
                            Tải lên ảnh chân dung
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'selfie')}
                          />
                        </label>
                      )}
                    </div>
                    {errors.selfie && (
                      <p className="mt-1 text-sm text-red-600">{errors.selfie}</p>
                    )}
                  </div>
                </div>


                {/* Nav Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab(2)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : (
                      'Gửi xác minh'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}