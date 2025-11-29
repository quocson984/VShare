import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { EquipmentModel } from '@/models/equipment';
import { InsuranceModel } from '@/models/insurance';
import { AccountModel } from '@/models/account';

const FALLBACK_RENTER_ID = '000000000000000000000002';
const FALLBACK_OWNER_ID = '000000000000000000000001';

export async function GET(req: NextRequest) {
  try {
    await connectMongoDB();

    const searchParams = req.nextUrl.searchParams;
    const renterId = searchParams.get('renterId');
    const ownerId = searchParams.get('ownerId');

    if (!renterId && !ownerId) {
      return NextResponse.json(
        { success: false, error: 'renterId or ownerId is required' },
        { status: 400 }
      );
    }

    // Build query filter
    const filter: { renterId?: string; ownerId?: string } = {};
    if (renterId) filter.renterId = renterId;
    if (ownerId) filter.ownerId = ownerId;

    // Fetch bookings
    const bookings = await BookingModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich bookings with equipment and account details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        // Get equipment details
        const equipment = await EquipmentModel.findById(booking.equipmentId).lean();
        
        // Get counterparty name
        let counterpartyName = '';
        if (renterId) {
          // If filtering by renterId, get owner name
          const owner = await AccountModel.findById(booking.ownerId).lean();
          counterpartyName = owner?.fullName || 'Unknown';
        } else if (ownerId) {
          // If filtering by ownerId, get renter name
          const renter = await AccountModel.findById(booking.renterId).lean();
          counterpartyName = renter?.fullName || 'Unknown';
        }

        return {
          id: booking._id.toString(),
          equipmentId: booking.equipmentId,
          equipmentTitle: equipment?.title || 'Unknown Equipment',
          equipmentImages: equipment?.images || [],
          startDate: booking.startDate,
          endDate: booking.endDate,
          quantity: booking.quantity || 1,
          totalPrice: booking.totalPrice,
          status: booking.status,
          createdAt: booking.createdAt,
          ...(renterId ? { ownerName: counterpartyName } : {}),
          ...(ownerId ? { renterName: counterpartyName } : {})
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    const payload = await request.json();
    const {
      equipmentId,
      startDate,
      endDate,
      renterId,
      ownerId,
      quantity = 1,
      insuranceId,
      notes
    } = payload;

    if (!equipmentId || !startDate || !endDate) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu thông tin thiết yếu để tạo đơn thuê'
      }, { status: 400 });
    }

    const equipment = await EquipmentModel.findById(equipmentId);
    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Thiết bị không tồn tại'
      }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        success: false,
        message: 'Ngày không hợp lệ'
      }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({
        success: false,
        message: 'Ngày kết thúc phải sau ngày bắt đầu'
      }, { status: 400 });
    }

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const basePrice = totalDays * equipment.pricePerDay * Math.max(1, quantity);
    const serviceFee = Math.round(basePrice * 0.05);
    let insuranceFee = 0;

    if (insuranceId) {
      const insurance = await InsuranceModel.findById(insuranceId);
      if (insurance && insurance.status === 'active') {
        const averageCoverage = (insurance.minCoverage + insurance.maxCoverage) / 2;
        insuranceFee = Math.max(15000, Math.round(averageCoverage * 0.0015 * totalDays));
      }
    }

    const totalPrice = basePrice + serviceFee + insuranceFee;
    const ownerReference = ownerId || equipment.ownerId?.toString() || FALLBACK_OWNER_ID;

    const booking = await BookingModel.create({
      equipmentId,
      quantity: Math.max(1, quantity),
      renterId: renterId || FALLBACK_RENTER_ID,
      ownerId: ownerReference,
      startDate: start,
      endDate: end,
      basePrice,
      serviceFee,
      insuranceFee,
      totalPrice,
      insuranceId: insuranceId || undefined,
      status: 'confirmed',
      notes: notes?.toString()
    });

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({
      success: false,
      message: 'Không thể tạo đặt thuê mới',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

