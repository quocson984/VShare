'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  Upload
} from 'lucide-react';

interface Equipment {
  _id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  images: string[];
  availability: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  owner: {
    _id: string;
    name: string;
    avatar?: string | null;
    rating: number;
    reviewCount: number;
    joinedDate: string;
  };
  specifications?: Record<string, string>;
  policies?: {
    cancellation?: string;
    usage?: string;
    damage?: string;
  };
  ownerId?: string;
  replacementPrice?: number;
  deposit?: number;
}

type DamageSeverity = 'none' | 'minor' | 'major' | 'critical';

interface BookingRecord {
  id: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  serviceFee: number;
  insuranceFee: number;
  totalPrice: number;
  status: string;
  checkinTime?: string;
  checkoutTime?: string;
  checkinImages?: string[];
  checkoutImages?: string[];
  insuranceId?: string;
  quantity: number;
  notes?: string;
}

interface IncidentSummary {
  id: string;
  type: 'damage' | 'late' | 'other';
  severity: 'minor' | 'major' | 'critical';
  description?: string;
  resolutionAmount?: number;
  createdAt?: string;
}

const severityMultipliers: Record<DamageSeverity, number> = {
  none: 0,
  minor: 0.15,
  major: 0.4,
  critical: 1
};

const filesToDataURLs = (files: File[]) => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) {
    return 'Không xác định';
  }
  const startDate = new Date(start).toLocaleDateString('vi-VN');
  const endDate = new Date(end).toLocaleDateString('vi-VN');
  return `${startDate} → ${endDate}`;
};

const formatDurationLabel = (minutes: number) => {
  if (minutes <= 0) return 'Không trễ';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hourLabel = hours ? `${hours} giờ` : '';
  const minuteLabel = mins ? `${mins} phút` : '';
  return [hourLabel, minuteLabel].filter(Boolean).join(' ');
};

const normalizeBooking = (booking: any): BookingRecord => ({
  id: booking._id?.toString() ?? booking.id,
  startDate: booking.startDate,
  endDate: booking.endDate,
  basePrice: booking.basePrice ?? 0,
  serviceFee: booking.serviceFee ?? 0,
  insuranceFee: booking.insuranceFee ?? 0,
  totalPrice: booking.totalPrice ?? 0,
  status: booking.status ?? 'confirmed',
  checkinTime: booking.checkinTime,
  checkoutTime: booking.checkoutTime,
  checkinImages: booking.checkinImages,
  checkoutImages: booking.checkoutImages,
  insuranceId: booking.insuranceId,
  quantity: booking.quantity ?? 1,
  notes: booking.notes
});

const normalizeIncident = (incident: any): IncidentSummary => ({
  id: incident._id?.toString() ?? incident.id,
  type: incident.type ?? 'other',
  severity: incident.severity ?? 'minor',
  description: incident.description,
  resolutionAmount: incident.resolutionAmount,
  createdAt: incident.createdAt
});

export default function MyEquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkinPhotos, setCheckinPhotos] = useState<File[]>([]);
  const [checkoutPhotos, setCheckoutPhotos] = useState<File[]>([]);
  const [checkinPreviewUrls, setCheckinPreviewUrls] = useState<string[]>([]);
  const [checkoutPreviewUrls, setCheckoutPreviewUrls] = useState<string[]>([]);
  const [checkinIssue, setCheckinIssue] = useState('');
  const [checkoutIssue, setCheckoutIssue] = useState('');
  const [checkinSeverity, setCheckinSeverity] = useState<DamageSeverity>('none');
  const [checkoutSeverity, setCheckoutSeverity] = useState<DamageSeverity>('none');
  const [checkinNote, setCheckinNote] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutLateReason, setCheckoutLateReason] = useState('');
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/my-equipment');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Không thể tải thiết bị của bạn');
        }
        setEquipment(data.data.equipment);
        setBooking(normalizeBooking(data.data.booking));
        if (Array.isArray(data.data.incidents)) {
          setIncidents(data.data.incidents.map(normalizeIncident));
        }
      } catch (err) {
        console.error(err);
        setError('Không thể tải dữ liệu thiết bị của bạn');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      checkinPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [checkinPreviewUrls]);

  useEffect(() => {
    return () => {
      checkoutPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [checkoutPreviewUrls]);

  const addIncidentsToLog = (incoming?: any | any[]) => {
    if (!incoming) return;
    const items = Array.isArray(incoming) ? incoming : [incoming];
    const normalized = items.filter(Boolean).map(normalizeIncident);
    if (!normalized.length) return;
    setIncidents((prev) => [...normalized, ...prev]);
  };

  const handleCheckinPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setCheckinPhotos(files);
    setCheckinPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  };

  const handleCheckoutPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setCheckoutPhotos(files);
    setCheckoutPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  };

  const handleCheckinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking || !equipment) return;
    setCheckinSubmitting(true);
    try {
      const images = checkinPhotos.length ? await filesToDataURLs(checkinPhotos) : [];
      const payload: Record<string, any> = {
        images,
        notes: checkinNote || undefined
      };

      if (checkinSeverity !== 'none' || checkinIssue.trim()) {
        payload.incident = {
          description: checkinIssue || 'Quan sát khi nhận thiết bị',
          severity: checkinSeverity === 'none' ? 'minor' : checkinSeverity,
          type: checkinSeverity === 'none' ? 'other' : 'damage',
          estimatedCharge:
            Math.round(
              ((equipment?.replacementPrice ?? equipment.pricePerDay * 5) *
                (severityMultipliers[checkinSeverity] ?? 0))
            ) || undefined
        };
      }

      const response = await fetch(`/api/bookings/${booking.id}/checkin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể ghi nhận check-in');
      }

      setBooking(normalizeBooking(data.data.booking));
      addIncidentsToLog(data.data.incident);
      setCheckinPhotos([]);
      setCheckinPreviewUrls([]);
      setCheckinNote('');
      setCheckinIssue('');
      setCheckinSeverity('none');
    } catch (err) {
      console.error('Check-in failed:', err);
      alert(err instanceof Error ? err.message : 'Lỗi khi lưu check-in');
    } finally {
      setCheckinSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking) return;
    setCheckoutSubmitting(true);
    try {
      const images = checkoutPhotos.length ? await filesToDataURLs(checkoutPhotos) : [];
      const payload = {
        images,
        notes: checkoutNote || undefined,
        severity: checkoutSeverity,
        issueDescription: checkoutIssue || undefined,
        lateMinutes: Math.max(
          0,
          Math.ceil(
            (Date.now() - new Date(booking.endDate).getTime()) / (1000 * 60)
          )
        ),
        lateReason: checkoutLateReason || undefined
      };

      const response = await fetch(`/api/bookings/${booking.id}/checkout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Không thể ghi nhận check-out');
      }

      setBooking(normalizeBooking(data.data.booking));
      addIncidentsToLog(data.data.incidents);
      setCheckoutPhotos([]);
      setCheckoutPreviewUrls([]);
      setCheckoutNote('');
      setCheckoutIssue('');
      setCheckoutSeverity('none');
      setCheckoutLateReason('');
    } catch (err) {
      console.error('Check-out failed:', err);
      alert(err instanceof Error ? err.message : 'Lỗi khi trả thiết bị');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-gray-600">Đang tải thiết bị của bạn...</span>
        </div>
      </div>
    );
  }

  if (error || !equipment || !booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto text-center py-20 px-4">
          <div className="text-red-500 mb-4">{error || 'Không tìm thấy thiết bị nào'}</div>
          <Link
            href="/equipments"
            className="inline-flex items-center justify-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const lateMinutes = Math.max(
    0,
    Math.ceil((Date.now() - new Date(booking.endDate).getTime()) / (1000 * 60))
  );
  const hourlyRate = equipment.pricePerDay / 24;
  const checkoutDamageEstimate = Math.round(
    ((equipment.replacementPrice ?? (equipment.pricePerDay ?? 0) * 10) *
      (severityMultipliers[checkoutSeverity] ?? 0))
  );
  const checkoutLateCharge =
    lateMinutes > 0 ? Math.round(Math.ceil(lateMinutes / 60) * hourlyRate) : 0;
  const checkoutExtraTotal = checkoutDamageEstimate + checkoutLateCharge;

  const canCheckin = !booking.checkinTime;
  const canCheckout = booking.checkinTime && !booking.checkoutTime;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase">Thiết bị của tôi</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Theo dõi đơn thuê và tình trạng thiết bị
            </h1>
          </div>
          <Link
            href={`/equipment/${equipment._id}`}
            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1 rotate-180" />
            Xem lại trang thiết bị
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <img
                src={equipment.images[0]}
                alt={equipment.title}
                className="w-full md:w-48 h-48 object-cover rounded-xl border border-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{equipment.title}</h2>
                  <span className="text-sm px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                    {equipment.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{equipment.description}</p>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {equipment.location?.address}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDateRange(booking.startDate, booking.endDate)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">Đơn giá</span>
                    <p className="font-semibold text-gray-900">
                      {equipment.pricePerDay.toLocaleString('vi-VN')}đ/ngày
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái</span>
                    <p className="font-semibold capitalize text-gray-900">{booking.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tổng thanh toán</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(booking.totalPrice ?? 0)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Phí dịch vụ</span>
                <span>{formatCurrency(booking.serviceFee ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí bảo hiểm</span>
                <span>{formatCurrency(booking.insuranceFee ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Số lượng</span>
                <span>{booking.quantity}</span>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-gray-700 flex items-start gap-2">
              <Shield className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Ghi nhận tình trạng thiết bị</p>
                <p>
                  Sau khi tạo đơn thuê, hãy check-in khi nhận và check-out khi trả thiết bị để cập nhật nhật ký.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Check-in</p>
                <p className="text-xs text-gray-500">
                  {booking.checkinTime
                    ? `Đã ghi nhận lúc ${formatDateTime(booking.checkinTime)}`
                    : 'Chưa có thông tin nhận thiết bị'}
                </p>
              </div>
              {!booking.checkinTime && (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  Cần hoàn tất
                </span>
              )}
            </div>

            {booking.checkinImages?.length ? (
              <div className="grid grid-cols-3 gap-2">
                {booking.checkinImages.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt="Check-in"
                    className="h-20 w-full object-cover rounded-md border border-gray-200"
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-3">
                Chưa có ảnh nhận hàng
              </div>
            )}

            {canCheckin ? (
              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                <div>
                  <label className="flex text-xs font-semibold text-gray-600 items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Ảnh check-in
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCheckinPhotoChange}
                    className="mt-1 text-xs text-gray-500"
                  />
                  {checkinPreviewUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {checkinPreviewUrls.map((preview) => (
                        <img
                          key={preview}
                          src={preview}
                          alt="Check-in preview"
                          className="h-20 w-full object-cover rounded-md border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Ghi chú</label>
                  <textarea
                    value={checkinNote}
                    onChange={(event) => setCheckinNote(event.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                    rows={2}
                    placeholder="Ghi nhận tình trạng thiết bị"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Mức độ hư hỏng</label>
                  <select
                    value={checkinSeverity}
                    onChange={(event) => setCheckinSeverity(event.target.value as DamageSeverity)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                  >
                    <option value="none">Không có hư hỏng</option>
                    <option value="minor">Nhẹ</option>
                    <option value="major">Trung bình</option>
                    <option value="critical">Nghiêm trọng</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Chi tiết nghi vấn</label>
                  <input
                    type="text"
                    value={checkinIssue}
                    onChange={(event) => setCheckinIssue(event.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                    placeholder="Mô tả điểm khác biệt nếu có"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                  disabled={checkinSubmitting}
                >
                  {checkinSubmitting ? 'Đang lưu...' : 'Ghi nhận check-in'}
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-3">
                <CheckCircle className="h-4 w-4" />
                Đã hoàn tất check-in
              </div>
            )}
          </div>

          <div className="space-y-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Check-out</p>
                <p className="text-xs text-gray-500">
                  {booking.checkoutTime
                    ? `Đã trả lúc ${formatDateTime(booking.checkoutTime)}`
                    : booking.checkinTime
                    ? 'Chưa ghi nhận trả thiết bị'
                    : 'Vui lòng check-in trước khi trả thiết bị'}
                </p>
              </div>
              {canCheckout ? (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  Đang chờ trả
                </span>
              ) : booking.checkoutTime ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </div>

            <div className="space-y-2 rounded-lg border border-dashed border-gray-300 bg-orange-50 p-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Trễ hạn</span>
                <span>{formatCurrency(checkoutLateCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hư hỏng (ước tính)</span>
                <span>{formatCurrency(checkoutDamageEstimate)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Tổng phụ thu dự kiến</span>
                <span>{formatCurrency(checkoutExtraTotal)}</span>
              </div>
              {lateMinutes > 0 && (
                <p className="text-xs text-orange-600">Đang trễ {formatDurationLabel(lateMinutes)}</p>
              )}
            </div>

            {booking.checkoutImages?.length ? (
              <div className="grid grid-cols-3 gap-2">
                {booking.checkoutImages.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={src}
                    alt="Check-out"
                    className="h-20 w-full object-cover rounded-md border border-gray-200"
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-3">
                Chưa có ảnh trả hàng
              </div>
            )}

            {canCheckout && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="flex text-xs font-semibold text-gray-600 items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Ảnh check-out
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCheckoutPhotoChange}
                    className="mt-1 text-xs text-gray-500"
                  />
                  {checkoutPreviewUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {checkoutPreviewUrls.map((preview) => (
                        <img
                          key={preview}
                          src={preview}
                          alt="Check-out preview"
                          className="h-20 w-full object-cover rounded-md border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={checkoutNote}
                    onChange={(event) => setCheckoutNote(event.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                    placeholder="Ghi lại tình trạng và thỏa thuận phụ thu"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Mức độ hư hỏng</label>
                  <select
                    value={checkoutSeverity}
                    onChange={(event) => setCheckoutSeverity(event.target.value as DamageSeverity)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                  >
                    <option value="none">Không có hư hỏng</option>
                    <option value="minor">Nhẹ</option>
                    <option value="major">Trung bình</option>
                    <option value="critical">Nghiêm trọng</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Chi tiết hư hỏng</label>
                  <input
                    type="text"
                    value={checkoutIssue}
                    onChange={(event) => setCheckoutIssue(event.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                    placeholder="Miêu tả khuyết điểm (nếu có)"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">Lý do trả trễ</label>
                  <textarea
                    rows={2}
                    value={checkoutLateReason}
                    onChange={(event) => setCheckoutLateReason(event.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-md p-2 text-sm"
                    placeholder="Ghi chú nếu có trễ hạn"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-md bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                  disabled={checkoutSubmitting}
                >
                  {checkoutSubmitting ? 'Đang gửi...' : 'Ghi nhận check-out'}
                </button>
              </form>
            )}
          </div>
        </div>

        {incidents.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Nhật ký sự cố
            </div>
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div key={incident.id} className="border border-dashed border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                    <span className="capitalize">{incident.type}</span>
                    <span className="text-xs text-gray-500">{incident.severity}</span>
                  </div>
                  {incident.description && (
                    <p className="text-xs text-gray-500 mt-1">{incident.description}</p>
                  )}
                  {incident.resolutionAmount != null && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ước tính chi phí: {formatCurrency(incident.resolutionAmount)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Thời gian: {formatDateTime(incident.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

