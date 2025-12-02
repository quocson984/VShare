import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

export async function POST(request: NextRequest) {
  try {
    const { accountId, role } = await request.json();

    if (!accountId || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update role
    const account = await AccountModel.findByIdAndUpdate(
      accountId,
      { role },
      { new: true }
    ).select('-password');

    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
