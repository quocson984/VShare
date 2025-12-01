import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { userId, fullname, phone, address, bio, latitude, longitude, avatar } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    // Only update fields that are provided
    if (fullname !== undefined) updateData.fullname = fullname;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update location if coordinates are provided
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
        address: address || '',
        country: 'Vietnam'
      };
    }

    // Update user profile
    const updatedUser = (await AccountModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean()) as Record<string, unknown>;

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Return updated user data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        phone: updatedUser.phone,
        address: updatedUser.address,
        bio: updatedUser.bio,
        location: updatedUser.location,
        avatar: updatedUser.avatar,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update profile'
    }, { status: 500 });
  }
}
