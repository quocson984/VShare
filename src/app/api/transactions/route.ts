import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
import { PayoutModel } from '@/models/payout';
import { BookingModel } from '@/models/booking';
import { EquipmentModel } from '@/models/equipment';
import { AccountModel } from '@/models/account';

export async function GET(req: NextRequest) {
  try {
    await connectMongoDB();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch payments (user as renter - chi tiền)
    const payments = await PaymentModel.find({ renterId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch payouts (user as owner - thu tiền)
    const payouts = await PayoutModel.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich payments with booking and equipment details
    const enrichedPayments = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payments.map(async (payment: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const booking: any = await BookingModel.findById(payment.bookingId).lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const equipment: any = booking ? await EquipmentModel.findById(booking.equipmentId).lean() : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const owner: any = booking ? await AccountModel.findById(booking.ownerId).lean() : null;

        return {
          id: payment._id.toString(),
          type: 'payment' as const,
          bookingId: payment.bookingId.toString(),
          equipmentTitle: equipment?.title || 'Unknown Equipment',
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          createdAt: payment.createdAt,
          counterpartyName: owner?.fullName || 'Unknown'
        };
      })
    );

    // Enrich payouts with booking and equipment details
    const enrichedPayouts = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payouts.map(async (payout: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const booking: any = await BookingModel.findById(payout.bookingId).lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const equipment: any = booking ? await EquipmentModel.findById(booking.equipmentId).lean() : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renter: any = booking ? await AccountModel.findById(booking.renterId).lean() : null;

        return {
          id: payout._id.toString(),
          type: 'payout' as const,
          bookingId: payout.bookingId.toString(),
          equipmentTitle: equipment?.title || 'Unknown Equipment',
          amount: payout.amount,
          status: payout.status,
          createdAt: payout.createdAt,
          counterpartyName: renter?.fullName || 'Unknown'
        };
      })
    );

    // Combine and sort by date
    const allTransactions = [...enrichedPayments, ...enrichedPayouts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: allTransactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
