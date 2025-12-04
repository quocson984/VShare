import { BookingModel } from '@/models/booking';

export async function updateBookingStatuses() {
  try {
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

    console.log(`Booking status updated: ${confirmedToOngoing.modifiedCount} confirmed->ongoing`);

    return {
      confirmedToOngoing: confirmedToOngoing.modifiedCount
    };
  } catch (error) {
    console.error('Error updating booking statuses:', error);
    return null;
  }
}
