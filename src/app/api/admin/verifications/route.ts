import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on status
    let query: any = {};
    
    if (status === 'pending') {
      query = {
        'verifications.status': 'pending',
        status: 'unverified'
      };
    } else if (status === 'verified') {
      query = {
        'verifications.status': 'verified',
        status: 'active'
      };
    } else if (status === 'rejected') {
      query = {
        'verifications.status': 'rejected'
      };
    }

    // Fetch users with pagination
    const skip = (page - 1) * limit;
    
    const users = await AccountModel.find(query)
      .select('email fullname phone address role createdAt verifications identityNumber identityFullname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await AccountModel.countDocuments(query);

    // Process verification data
    const processedUsers = users.map(user => {
      const latestVerification = user.verifications && user.verifications.length > 0 
        ? user.verifications[user.verifications.length - 1]
        : null;

      return {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        address: user.address,
        role: user.role,
        identityNumber: user.identityNumber,
        identityFullname: user.identityFullname,
        createdAt: user.createdAt,
        verification: {
          status: latestVerification?.status || 'pending',
          createdAt: latestVerification?.createdAt || user.createdAt,
          updatedAt: latestVerification?.updatedAt || null,
          notes: latestVerification?.notes || null,
          frontCccd: latestVerification?.frontCccd || null,
          backCccd: latestVerification?.backCccd || null,
          selfie: latestVerification?.selfie || null
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: processedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Admin verification API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching verification data'
    }, { status: 500 });
  }
}
