import { PaymentModel } from '@/models/payment';
import { BookingModel } from '@/models/booking';

export async function expireOldPayments() {
  try {
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

    if (updatedCount > 0) {
      console.log(`Expired ${updatedCount} payments and bookings`);
    }

    return updatedCount;
  } catch (error) {
    console.error('Error expiring old payments:', error);
    return 0;
  }
}
