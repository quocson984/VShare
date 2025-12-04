import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { PayoutModel } from '@/models/payout';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const bookingId = params.id;
    
    // Find the booking
    const booking = await BookingModel.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is ongoing
    if (booking.status !== 'ongoing') {
      return NextResponse.json(
        { success: false, message: 'Only ongoing bookings can be completed' },
        { status: 400 }
      );
    }

    // Check if end date has passed
    const now = new Date();
    const endDate = new Date(booking.endDate);
    
    if (now <= endDate) {
      return NextResponse.json(
        { success: false, message: 'Cannot complete booking before end date' },
        { status: 400 }
      );
    }

    // Update booking status to completed
    booking.status = 'completed';
    await booking.save();

    // Calculate payout amount (basePrice only, owner doesn't get service fee or insurance fee)
    const payoutAmount = booking.basePrice;

    // Create payout for owner
    const payout = new PayoutModel({
      ownerId: booking.ownerId,
      amount: payoutAmount,
      status: 'pending',
      bookingId: booking._id,
      notes: `Thanh toán cho đơn thuê thiết bị`
    });

    await payout.save();

    console.log(`Created payout for booking ${bookingId}: ${payoutAmount}đ to owner ${booking.ownerId}`);

    return NextResponse.json({
      success: true,
      data: {
        booking,
        payout
      }
    });

  } catch (error) {
    console.error('Error completing booking:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
