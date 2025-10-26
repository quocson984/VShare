import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { userId, action, notes } = body;

    if (!userId || !action) {
      return NextResponse.json({
        success: false,
        message: 'User ID and action are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Action must be either approve or reject'
      }, { status: 400 });
    }

    // Find the user
    const user = await AccountModel.findById(userId);
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

    if (!latestVerification) {
      return NextResponse.json({
        success: false,
        message: 'No verification found for this user'
      }, { status: 404 });
    }

    // Update verification status
    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    const newAccountStatus = action === 'approve' ? 'active' : 'unverified';

    // Update the latest verification
    latestVerification.status = newStatus;
    latestVerification.updatedAt = new Date();
    if (notes) {
      latestVerification.notes = notes;
    }

    // Update user status
    user.status = newAccountStatus;

    // Save changes
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Verification ${action}d successfully`,
      data: {
        userId: user._id.toString(),
        verificationStatus: newStatus,
        accountStatus: newAccountStatus,
        updatedAt: latestVerification.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Admin verification action API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing verification action'
    }, { status: 500 });
  }
}
