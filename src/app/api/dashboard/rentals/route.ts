import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { EquipmentModel } from '@/models/equipment';
import { AccountModel } from '@/models/account';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const userId = request.nextUrl.searchParams.get('userId');
    const role = request.nextUrl.searchParams.get('role'); // 'renter' or 'owner'
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Build query based on role
    const query = role === 'owner' 
      ? { ownerId: userId }
      : { renterId: userId };

    // Fetch bookings
    const bookings = await BookingModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich bookings with equipment and user details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking: any) => {
        const [equipment, renter, owner] = await Promise.all([
          EquipmentModel.findById(booking.equipmentId).lean(),
          AccountModel.findById(booking.renterId).select('fullname email phone').lean(),
          AccountModel.findById(booking.ownerId).select('fullname email phone').lean()
        ]);

        return {
          id: booking._id.toString(),
          bookingId: booking._id.toString(),
          equipmentId: booking.equipmentId.toString(),
          equipmentTitle: (equipment as any)?.title || 'Unknown Equipment',
          equipmentImage: (equipment as any)?.images?.[0] || '',
          renterId: booking.renterId.toString(),
          renterName: (renter as any)?.fullname || 'Unknown',
          renterEmail: (renter as any)?.email || '',
          renterPhone: (renter as any)?.phone || '',
          ownerId: booking.ownerId.toString(),
          ownerName: (owner as any)?.fullname || 'Unknown',
          ownerEmail: (owner as any)?.email || '',
          ownerPhone: (owner as any)?.phone || '',
          startDate: booking.startDate,
          endDate: booking.endDate,
          quantity: booking.quantity,
          basePrice: booking.basePrice,
          serviceFee: booking.serviceFee,
          insuranceFee: booking.insuranceFee,
          totalPrice: booking.totalPrice,
          status: booking.status,
          notes: booking.notes,
          checkinTime: booking.checkinTime,
          checkoutTime: booking.checkoutTime,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        };
      })
    );

    // Calculate summary statistics
    const stats = {
      total: enrichedBookings.length,
      pending: enrichedBookings.filter(b => b.status === 'pending').length,
      ongoing: enrichedBookings.filter(b => b.status === 'ongoing').length,
      completed: enrichedBookings.filter(b => b.status === 'completed').length,
      canceled: enrichedBookings.filter(b => b.status === 'canceled').length,
      totalRevenue: enrichedBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0)
    };

    return NextResponse.json({
      success: true,
      data: enrichedBookings,
      stats
    });
  } catch (error) {
    console.error('Rentals fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch rentals',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
