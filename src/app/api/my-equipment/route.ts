import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { EquipmentModel, type EquipmentType } from '@/models/equipment';
import { IncidentModel } from '@/models/incident';

const FALLBACK_OWNER_ID = '000000000000000000000001';
const FALLBACK_RENTER_ID = '000000000000000000000002';

type EquipmentDetail = EquipmentType & {
  rating?: number;
  reviewCount?: number;
  availability?: string;
  policies?: {
    cancellation?: string;
    usage?: string;
    damage?: string;
    deposit?: number;
  };
  specifications?: Record<string, string>;
};

type MyEquipmentPayload = {
  equipment: ReturnType<typeof transformEquipment>;
  booking: ReturnType<typeof normalizeBooking>;
  incidents: ReturnType<typeof normalizeIncident>[];
};

const formatDateString = (value?: string | Date | null) => {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
};

const normalizeBooking = (booking: any) => ({
  id: booking._id?.toString() ?? booking.id ?? 'mock-booking',
  equipmentId: booking.equipmentId?.toString() ?? booking.equipmentId ?? 'mock-equipment',
  renterId: booking.renterId?.toString() ?? FALLBACK_RENTER_ID,
  ownerId: booking.ownerId?.toString() ?? FALLBACK_OWNER_ID,
  startDate: formatDateString(booking.startDate) ?? new Date().toISOString(),
  endDate:
    formatDateString(booking.endDate) ??
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  basePrice: booking.basePrice ?? 0,
  serviceFee: booking.serviceFee ?? 0,
  insuranceFee: booking.insuranceFee ?? 0,
  totalPrice: booking.totalPrice ?? 0,
  status: booking.status ?? 'confirmed',
  checkinTime: formatDateString(booking.checkinTime),
  checkoutTime: formatDateString(booking.checkoutTime),
  checkinImages: Array.isArray(booking.checkinImages) ? booking.checkinImages : [],
  checkoutImages: Array.isArray(booking.checkoutImages) ? booking.checkoutImages : [],
  insuranceId: booking.insuranceId?.toString() ?? booking.insuranceId,
  quantity: booking.quantity ?? 1,
  notes: booking.notes ?? ''
});

const normalizeIncident = (incident: any) => ({
  id: incident._id?.toString() ?? incident.id ?? `incident-${Date.now()}`,
  type: incident.type ?? 'other',
  severity: incident.severity ?? 'minor',
  description: incident.description ?? '',
  resolutionAmount: incident.resolutionAmount ?? undefined,
  createdAt: formatDateString(incident.createdAt)
});

const transformEquipment = (equipment?: EquipmentDetail | null) => {
  const fallbackEquipment = {
    _id: 'mock-equipment',
    title: 'Canon EOS R5 Camera',
    description:
      'Máy ảnh full-frame chuyên nghiệp với độ phân giải cao 45MP. Thích hợp cho chụp ảnh cưới, sự kiện, và nhiếp ảnh chuyên nghiệp.',
    category: 'camera',
    pricePerDay: 500000,
    rating: 4.8,
    reviewCount: 15,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&h=600&fit=crop'
    ],
    availability: 'available',
    location: {
      address: 'Quận 1, TP.HCM',
      coordinates: [106.682, 10.7629] as [number, number]
    },
    ownerId: FALLBACK_OWNER_ID,
    replacementPrice: 2800000,
    deposit: 550000,
    owner: {
      _id: FALLBACK_OWNER_ID,
      name: 'Nguyễn Văn A',
      avatar: null,
      rating: 4.9,
      reviewCount: 25,
      joinedDate: new Date('2023-01-01').toISOString()
    },
    specifications: {
      'Độ phân giải': '45MP',
      'Cảm biến': 'Full-frame CMOS',
      Video: '8K RAW, 4K 120fps',
      'Ống kính': 'RF Mount',
      Pin: 'LP-E6NH'
    } as Record<string, string>,
    policies: {
      cancellation: 'Hủy miễn phí trong 24 giờ đầu',
      usage: 'Sử dụng cẩn thận và trả về đúng hạn',
      damage: 'Bồi thường 100% giá trị thiết bị nếu hư hỏng'
    }
  };

  if (!equipment) {
    return fallbackEquipment;
  }

  const specs =
    equipment.specifications ||
    equipment.specs?.reduce<Record<string, string>>((acc, spec) => {
      if (spec?.name) {
        acc[spec.name] = spec.value ?? '';
      }
      return acc;
    }, {}) ||
    {};

  return {
    _id: equipment._id?.toString() ?? 'unknown-equipment',
    title: equipment.title,
    description: equipment.description ?? fallbackEquipment.description,
    category: equipment.category,
    pricePerDay: equipment.pricePerDay ?? fallbackEquipment.pricePerDay,
    rating: equipment.rating ?? fallbackEquipment.rating,
    reviewCount: equipment.reviewCount ?? fallbackEquipment.reviewCount,
    images: Array.isArray(equipment.images) && equipment.images.length
      ? equipment.images
      : fallbackEquipment.images,
    availability: equipment.status ?? fallbackEquipment.availability,
    location: equipment.location ?? fallbackEquipment.location,
    ownerId: equipment.ownerId?.toString() ?? FALLBACK_OWNER_ID,
    replacementPrice: equipment.replacementPrice ?? fallbackEquipment.replacementPrice,
    deposit: equipment.deposit ?? fallbackEquipment.deposit,
    owner: {
      _id: equipment.ownerId?.toString() ?? FALLBACK_OWNER_ID,
      name: 'Equipment Owner',
      avatar: null,
      rating: 4.8,
      reviewCount: 10,
      joinedDate: new Date().toISOString()
    },
    specifications: Object.keys(specs).length ? specs : fallbackEquipment.specifications,
    policies:
      equipment.policies ?? {
        cancellation: 'Hủy miễn phí trong 24 giờ đầu',
        usage: 'Sử dụng cẩn thận và trả về đúng hạn',
        damage: 'Bồi thường 100% giá trị thiết bị nếu hư hỏng'
      }
  };
};

const buildFallbackPayload = (): MyEquipmentPayload => {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 3);

  const fallbackBooking = {
    _id: 'mock-booking',
    equipmentId: 'mock-equipment',
    renterId: FALLBACK_RENTER_ID,
    ownerId: FALLBACK_OWNER_ID,
    startDate: start,
    endDate: end,
    basePrice: 1500000,
    serviceFee: 75000,
    insuranceFee: 30000,
    totalPrice: 1605000,
    quantity: 1,
    status: 'confirmed',
    checkinImages: [],
    checkoutImages: []
  };

  return {
    equipment: transformEquipment(),
    booking: normalizeBooking(fallbackBooking),
    incidents: []
  };
};

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    const renterId = request.nextUrl.searchParams.get('renterId') ?? FALLBACK_RENTER_ID;

    const booking = await BookingModel.findOne({ renterId })
      .sort({ createdAt: -1 })
      .lean();

    if (!booking) {
      return NextResponse.json({
        success: true,
        data: buildFallbackPayload(),
        fallback: true
      });
    }

    const [equipment, incidents] = await Promise.all([
      EquipmentModel.findById(booking.equipmentId).lean(),
      IncidentModel.find({ bookingId: booking._id }).sort({ createdAt: -1 }).lean()
    ]);

    if (!equipment) {
      return NextResponse.json({
        success: true,
        data: buildFallbackPayload(),
        fallback: true,
        message: 'Không tìm thấy thiết bị liên quan, sử dụng dữ liệu mặc định'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        equipment: transformEquipment(equipment as EquipmentDetail),
        booking: normalizeBooking(booking),
        incidents: incidents.map(normalizeIncident)
      }
    });
  } catch (error) {
    console.error('My equipment API error:', error);
    return NextResponse.json(
      {
        success: true,
        data: buildFallbackPayload(),
        fallback: true,
        message: 'Đang sử dụng dữ liệu giả lập do lỗi máy chủ'
      },
      { status: 200 }
    );
  }
}

