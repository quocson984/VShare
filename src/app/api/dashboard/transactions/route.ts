import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
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

    // Fetch payments
    const payments = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich payments with booking and equipment details
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const booking = await BookingModel.findById(payment.bookingId).lean();
        
        if (!booking) {
          return {
            id: payment._id.toString(),
            type: 'payment',
            amount: payment.amount,
            status: payment.status,
            method: payment.method,
            content: payment.content,
            txnId: payment.txnId,
            createdAt: payment.createdAt,
            paidAt: payment.paidAt,
            equipmentTitle: 'Unknown Equipment',
            counterpartyName: 'Unknown'
          };
        }

        const [equipment, counterparty] = await Promise.all([
          EquipmentModel.findById(booking.equipmentId).lean(),
          AccountModel.findById(
            role === 'owner' ? booking.renterId : booking.ownerId
          ).select('fullname').lean()
        ]);

        return {
          id: payment._id.toString(),
          paymentId: payment._id.toString(),
          bookingId: payment.bookingId.toString(),
          type: 'payment',
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          content: payment.content,
          txnId: payment.txnId,
          ref: payment.ref,
          equipmentTitle: equipment?.title || 'Unknown Equipment',
          equipmentId: booking.equipmentId.toString(),
          counterpartyName: counterparty?.fullname || 'Unknown',
          counterpartyRole: role === 'owner' ? 'Người thuê' : 'Chủ thiết bị',
          startDate: booking.startDate,
          endDate: booking.endDate,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          paidAt: payment.paidAt
        };
      })
    );

    // Calculate summary statistics
    const stats = {
      total: enrichedPayments.length,
      paid: enrichedPayments.filter(p => p.status === 'paid').length,
      pending: enrichedPayments.filter(p => p.status === 'pending').length,
      failed: enrichedPayments.filter(p => p.status === 'failed').length,
      totalAmount: enrichedPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({
      success: true,
      data: enrichedPayments,
      stats
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
