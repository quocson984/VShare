import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { PaymentModel } from '@/models/payment';
import { BookingModel } from '@/models/booking';

const PAYFASTACY_API_URL = 'https://payfastacy.vercel.app/init';
const PAYFASTACY_API_KEY = process.env.PAYFASTACY_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const { bookingId } = await request.json();

    console.log('Payment init for booking:', bookingId);

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        message: 'Booking ID is required'
      }, { status: 400 });
    }

    // Get booking details
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return NextResponse.json({
        success: false,
        message: 'Booking not found'
      }, { status: 404 });
    }

    console.log('Booking found:', { id: booking._id, totalPrice: booking.totalPrice });

    // Check if payment already exists for this booking
    const existingPayment = await PaymentModel.findOne({ bookingId });
    if (existingPayment && existingPayment.status === 'paid') {
      return NextResponse.json({
        success: false,
        message: 'Payment already completed for this booking'
      }, { status: 400 });
    }

    console.log('API Key configured:', !!PAYFASTACY_API_KEY);

    // First, try to search if payment already exists in PayFastacy
    const searchUrl = `https://payfastacy.vercel.app/search?ref=${bookingId.toString()}`;
    console.log('Checking existing payment:', searchUrl);

    let content: string;
    let amount: number;

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'x-api-key': PAYFASTACY_API_KEY
      }
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Search result:', searchData);

      if (searchData.success && searchData.count > 0) {
        // Payment already exists in PayFastacy
        const paymentRecord = searchData.data[0];
        content = paymentRecord.content;
        amount = paymentRecord.amount;
        console.log('Using existing payment record:', { content, amount });
      } else {
        // Payment doesn't exist, create new one
        console.log('Creating new payment in PayFastacy');
        
        const initResponse = await fetch(PAYFASTACY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': PAYFASTACY_API_KEY
          },
          body: JSON.stringify({
            amount: booking.totalPrice,
            ref: bookingId.toString()
          })
        });

        console.log('PayFastacy init response status:', initResponse.status);

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          console.error('PayFastacy init error:', errorText);
          
          // If error is "Reference already exists", search again to get existing record
          if (initResponse.status === 400 && errorText.includes('Reference code already exists')) {
            console.log('Ref already exists, searching for existing record...');
            const retrySearchResponse = await fetch(searchUrl, {
              method: 'GET',
              headers: {
                'x-api-key': PAYFASTACY_API_KEY
              }
            });

            if (retrySearchResponse.ok) {
              const retrySearchData = await retrySearchResponse.json();
              console.log('Retry search result:', retrySearchData);

              if (retrySearchData.success && retrySearchData.count > 0) {
                const paymentRecord = retrySearchData.data[0];
                content = paymentRecord.content;
                amount = paymentRecord.amount;
                console.log('Found existing payment after retry:', { content, amount });
              } else {
                throw new Error('Reference exists but payment not found in search');
              }
            } else {
              throw new Error(`Failed to search after ref exists error: ${retrySearchResponse.status}`);
            }
          } else {
            throw new Error(`PayFastacy init failed: ${initResponse.status} - ${errorText}`);
          }
        } else {
          const initData = await initResponse.json();
          console.log('PayFastacy init response:', initData);
          
          if (!initData.success) {
            throw new Error(initData.error || 'Payment initialization failed');
          }

          // Search again to get the content
          const newSearchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'x-api-key': PAYFASTACY_API_KEY
            }
          });

          if (!newSearchResponse.ok) {
            throw new Error(`Failed to search payment after init: ${newSearchResponse.status}`);
          }

          const newSearchData = await newSearchResponse.json();
          console.log('New search result:', newSearchData);

          if (!newSearchData.success || !newSearchData.data || newSearchData.data.length === 0) {
            throw new Error('Payment record not found after init');
          }

          const paymentRecord = newSearchData.data[0];
          content = paymentRecord.content;
          amount = paymentRecord.amount;
        }
      }
    } else {
      throw new Error(`Failed to check existing payment: ${searchResponse.status}`);
    }

    // Create or update payment record
    console.log('Creating/updating payment record...');
    let payment;
    
    try {
      if (existingPayment) {
        console.log('Updating existing payment:', existingPayment._id);
        await PaymentModel.updateOne(
          { _id: existingPayment._id },
          {
            $set: {
              amount,
              content,
              status: 'pending',
              updatedAt: new Date()
            }
          }
        );
        payment = await PaymentModel.findById(existingPayment._id);
        if (!payment) {
          throw new Error('Failed to retrieve updated payment');
        }
      } else {
        console.log('Creating new payment record');
        payment = await PaymentModel.create({
          bookingId,
          renterId: booking.renterId,
          ownerId: booking.ownerId,
          amount,
          content,
          ref: bookingId.toString(),
          status: 'pending',
          method: 'bank_transfer'
        });
      }
      console.log('Payment record saved:', payment._id);
    } catch (dbError) {
      console.error('Database error saving payment:', dbError);
      throw new Error(`Failed to save payment record: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`);
    }

    if (!payment) {
      throw new Error('Payment object is null after save');
    }

    const responseData = {
      paymentId: payment._id.toString(),
      bookingId: bookingId.toString(),
      amount,
      content,
      qrData: {
        accountNumber: '21736271',
        bank: 'ACB',
        amount,
        content
      }
    };

    console.log('Returning response:', responseData);

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Payment init error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
