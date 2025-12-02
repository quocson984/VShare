import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { PaymentModel } from '@/models/payment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const bookings = await BookingModel.find()
      .populate({
        path: 'equipmentId',
        select: 'title images pricePerDay'
      })
      .populate({
        path: 'renterId',
        select: 'fullname email phone avatar'
      })
      .populate({
        path: 'ownerId',
        select: 'fullname email phone'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Get payment status for each booking
    const bookingsWithPayment = await Promise.all(
      bookings.map(async (booking: any) => {
        const payment = await PaymentModel.findOne({ bookingId: booking._id })
          .sort({ createdAt: -1 })
          .lean();
        
        // Map 'title' to 'name' for frontend compatibility
        if (booking.equipmentId) {
          booking.equipmentId.name = booking.equipmentId.title;
        }
        
        return {
          ...booking,
          paymentStatus: payment?.status || 'pending',
          paymentMethod: payment?.method,
          paidAt: payment?.paidAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: bookingsWithPayment,
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
