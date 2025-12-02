import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const bookings = await BookingModel.find()
      .populate('equipmentId', 'name images pricePerDay')
      .populate('renterId', 'fullname email phone avatar')
      .populate('ownerId', 'fullname email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
