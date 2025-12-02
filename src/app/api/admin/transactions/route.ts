import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
import { PayoutModel } from '@/models/payout';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const [payments, payouts] = await Promise.all([
      PaymentModel.find()
        .populate('bookingId')
        .populate({
          path: 'bookingId',
          populate: [
            { path: 'equipmentId', select: 'name' },
            { path: 'renterId', select: 'fullname email' }
          ]
        })
        .sort({ createdAt: -1 })
        .lean(),
      
      PayoutModel.find()
        .populate('ownerId', 'fullname email phone')
        .populate('bookingId', 'startDate endDate totalPrice')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        payouts
      },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
