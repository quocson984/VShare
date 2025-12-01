import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { PayoutModel } from '@/models/payout';
import { BookingModel } from '@/models/booking';
import { EquipmentModel } from '@/models/equipment';
import { AccountModel } from '@/models/account';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const ownerId = request.nextUrl.searchParams.get('ownerId');
    
    if (!ownerId) {
      return NextResponse.json({
        success: false,
        message: 'Owner ID is required'
      }, { status: 400 });
    }

    // Fetch payouts for this owner
    const payouts = await PayoutModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich payouts with booking and equipment details
    const enrichedPayouts = await Promise.all(
      payouts.map(async (payout) => {
        const booking = await BookingModel.findById(payout.bookingId).lean();
        
        if (!booking) {
          return {
            id: payout._id.toString(),
            type: 'payout',
            amount: payout.amount,
            status: payout.status,
            method: payout.method || 'bank_transfer',
            createdAt: payout.createdAt,
            processedAt: payout.processedAt,
            equipmentTitle: 'Unknown Equipment',
            renterName: 'Unknown'
          };
        }

        const [equipment, renter] = await Promise.all([
          EquipmentModel.findById(booking.equipmentId).lean(),
          AccountModel.findById(booking.renterId).select('fullname').lean()
        ]);

        return {
          id: payout._id.toString(),
          payoutId: payout._id.toString(),
          bookingId: payout.bookingId.toString(),
          type: 'payout',
          amount: payout.amount,
          status: payout.status,
          method: payout.method || 'bank_transfer',
          bankAccount: payout.bankAccount,
          notes: payout.notes,
          equipmentId: booking.equipmentId.toString(),
          equipmentTitle: equipment?.title || 'Unknown Equipment',
          renterName: renter?.fullname || 'Unknown',
          bookingStartDate: booking.startDate,
          bookingEndDate: booking.endDate,
          bookingTotalPrice: booking.totalPrice,
          createdAt: payout.createdAt,
          updatedAt: payout.updatedAt,
          processedAt: payout.processedAt
        };
      })
    );

    // Calculate summary statistics
    const stats = {
      total: enrichedPayouts.length,
      pending: enrichedPayouts.filter(p => p.status === 'pending').length,
      processing: enrichedPayouts.filter(p => p.status === 'processing').length,
      completed: enrichedPayouts.filter(p => p.status === 'completed').length,
      failed: enrichedPayouts.filter(p => p.status === 'failed').length,
      totalAmount: enrichedPayouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: enrichedPayouts
        .filter(p => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({
      success: true,
      data: enrichedPayouts,
      stats
    });
  } catch (error) {
    console.error('Payouts fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payouts',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
