import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
import { BookingModel } from '@/models/booking';

const PAYFASTACY_API_URL = 'https://payfastacy.vercel.app/search';
const PAYFASTACY_API_KEY = process.env.PAYFASTACY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const bookingId = request.nextUrl.searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        message: 'Booking ID is required'
      }, { status: 400 });
    }

    // Get local payment record
    const payment = await PaymentModel.findOne({ bookingId });
    if (!payment) {
      return NextResponse.json({
        success: false,
        message: 'Payment not found'
      }, { status: 404 });
    }

    // If already paid, return success
    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'paid',
          payment
        }
      });
    }

    // Search PayFastacy API by ref to check payment status
    const searchUrl = `${PAYFASTACY_API_URL}?ref=${bookingId}`;
    console.log('Checking payment status:', searchUrl);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-api-key': PAYFASTACY_API_KEY
      }
    });

    console.log('PayFastacy check response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayFastacy check error:', errorText);
      throw new Error(`Failed to check payment status: ${response.status}`);
    }

    const data = await response.json();
    console.log('PayFastacy search result:', JSON.stringify(data, null, 2));

    if (data.success && data.count > 0) {
      const paymentRecord = data.data[0];
      console.log('Payment record status:', paymentRecord.status);
      
      // Check if status is 'paid'
      if (paymentRecord.status === 'paid') {
        console.log('Payment confirmed! Updating records...');
        
        // Payment confirmed! Update local records using updateOne (skip validation)
        await PaymentModel.updateOne(
          { _id: payment._id },
          {
            $set: {
              status: 'paid',
              txnId: paymentRecord.txnId?.toString(),
              paidAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        // Get updated payment
        const updatedPayment = await PaymentModel.findById(payment._id);

        // Update booking status from 'pending' to 'ongoing'
        await BookingModel.findByIdAndUpdate(bookingId, {
          status: 'ongoing'
        });

        console.log('Payment and booking updated successfully');

        return NextResponse.json({
          success: true,
          data: {
            status: 'paid',
            payment: updatedPayment,
            txnId: paymentRecord.txnId
          }
        });
      } else {
        console.log('Payment not yet paid, status:', paymentRecord.status);
      }
    } else {
      console.log('No payment record found or count is 0');
    }

    // Payment not yet confirmed
    return NextResponse.json({
      success: true,
      data: {
        status: 'pending',
        payment
      }
    });
  } catch (error) {
    console.error('Payment check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check payment status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
