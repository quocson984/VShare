import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipmentId = params.id;

    // Find all confirmed bookings for this equipment
    const bookings = await BookingModel.find({
      equipmentId: equipmentId,
      status: { $in: ['confirmed', 'pending'] }
    }).select('startDate endDate');

    // Return booked date ranges
    const bookedDates = bookings.map(booking => ({
      start: booking.startDate,
      end: booking.endDate
    }));

    return NextResponse.json({
      success: true,
      data: bookedDates
    });

  } catch (error) {
    console.error('Error fetching booked dates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch booked dates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
