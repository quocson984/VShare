import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';

export async function POST() {
  try {
    await connectDB();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Update bookings from 'confirmed' to 'ongoing' if start date has arrived
    const confirmedToOngoing = await BookingModel.updateMany(
      {
        status: 'confirmed',
        startDate: { $lte: now }
      },
      {
        $set: { status: 'ongoing' }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        confirmedToOngoing: confirmedToOngoing.modifiedCount
      }
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET() {
  return POST();
}
