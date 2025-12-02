import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

// POST - Submit verification with images
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { userId, verificationImages } = body;

    if (!userId || !verificationImages || !Array.isArray(verificationImages)) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    if (verificationImages.length !== 3) {
      return NextResponse.json({
        success: false,
        message: 'Must upload exactly 3 verification images'
      }, { status: 400 });
    }

    // Create new verification record
    const verification = {
      status: 'pending',
      frontCccd: verificationImages[0],
      backCccd: verificationImages[1],
      selfie: verificationImages[2],
      notes: ''
    };

    // Update user with verification record
    const updatedUser = await AccountModel.findByIdAndUpdate(
      userId,
      {
        $push: { verifications: verification }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification submitted successfully',
      data: {
        status: 'pending',
        submittedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
