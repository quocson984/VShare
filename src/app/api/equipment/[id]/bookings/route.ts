import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { AccountModel } from '@/models/account';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipmentId = params.id;
    const { searchParams } = new URL(request.url);
    const detailView = searchParams.get('detailed');

    // If detailed view is requested (for owner dashboard)
    if (detailView === 'true') {
      const bookings = await BookingModel.find({
        equipmentId: equipmentId
      })
        .sort({ createdAt: -1 })
        .lean();

      // Populate renter information
      const bookingsWithRenter = await Promise.all(
        bookings.map(async (booking) => {
          const renter = await AccountModel.findById(booking.renterId).select('firstName lastName email');
          return {
            id: booking._id.toString(),
            renterId: booking.renterId,
            renterName: renter ? `${renter.firstName} ${renter.lastName}` : 'Unknown',
            renterEmail: renter?.email || '',
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            status: booking.status,
            createdAt: booking.createdAt
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: bookingsWithRenter
      });
    }

    // Default view - just return booked date ranges
    const bookings = await BookingModel.find({
      equipmentId: equipmentId,
      status: { $in: ['confirmed', 'pending', 'active'] }
    }).select('startDate endDate');

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
