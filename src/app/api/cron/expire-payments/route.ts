import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
import { BookingModel } from '@/models/booking';

export async function POST() {
  try {
    await connectDB();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find pending payments older than 5 minutes
    const expiredPayments = await PaymentModel.find({
      status: 'pending',
      createdAt: { $lt: fiveMinutesAgo }
    });

    let updatedCount = 0;

    for (const payment of expiredPayments) {
      // Update payment status to failed
      await PaymentModel.findByIdAndUpdate(payment._id, {
        status: 'failed'
      });

      // Update booking status to failed
      await BookingModel.findByIdAndUpdate(payment.bookingId, {
        status: 'failed'
      });

      updatedCount++;
    }

    console.log(`Expired ${updatedCount} payments and bookings`);

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: updatedCount
      }
    });
  } catch (error) {
    console.error('Payment timeout error:', error);
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
