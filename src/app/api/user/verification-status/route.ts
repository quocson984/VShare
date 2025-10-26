import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Find user by ID
    const user = await AccountModel.findById(userId).select('verifications status createdAt');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Get the latest verification
    const latestVerification = user.verifications && user.verifications.length > 0 
      ? user.verifications[user.verifications.length - 1]
      : null;

    const verificationData = {
      status: latestVerification?.status || 'pending',
      createdAt: latestVerification?.createdAt || user.createdAt,
      updatedAt: latestVerification?.updatedAt || null,
      notes: latestVerification?.notes || null
    };

    return NextResponse.json({
      success: true,
      verification: verificationData,
      userStatus: user.status
    });

  } catch (error: any) {
    console.error('Verification status API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching verification status'
    }, { status: 500 });
  }
}
