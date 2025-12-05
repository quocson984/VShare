import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

const demoUsers = [
  {
    email: 'admin@vshare.com',
    password: '123456',
    name: 'Admin User',
    role: 'admin',
    isVerified: true,
    isActive: true
  },
  {
    email: 'user@vshare.com',
    password: '123456',
    name: 'Test User',
    role: 'user',
    isVerified: true,
    isActive: true
  },
  {
    email: 'demo@vshare.com',
    password: 'demo123',
    name: 'Demo User',
    role: 'user',
    isVerified: false,
    isActive: true
  },
  {
    email: 'renter@example.com',
    password: 'password',
    name: 'Renter User',
    role: 'user',
    isVerified: true,
    isActive: true
  },
  {
    email: 'owner@example.com',
    password: 'password',
    name: 'Owner User',
    role: 'user',
    isVerified: true,
    isActive: true
  }
];

export async function POST() {
  try {
    await connectMongoDB();
    
    // Clear existing demo users first
    await AccountModel.deleteMany({ 
      email: { $in: demoUsers.map(u => u.email) } 
    });

    // Insert demo users
    await AccountModel.insertMany(demoUsers);
    
    return NextResponse.json({
      success: true,
      message: `Created ${result.length} demo users`,
      users: result.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }))
    });

  } catch (error: any) {
    console.error('Seed users error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to seed users',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectMongoDB();
    
    const users = await AccountModel.find({}, 'email name role isVerified createdAt').lean();
    
    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      })),
      demo_accounts: [
        { email: 'admin@vshare.com', password: '123456' },
        { email: 'user@vshare.com', password: '123456' },
        { email: 'demo@vshare.com', password: 'demo123' }
      ]
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get users',
      details: error.message
    }, { status: 500 });
  }
}