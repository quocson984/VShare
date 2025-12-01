import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';  // Changed from UserModel to AccountModel

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called');
    
    // Connect to MongoDB
    await connectMongoDB();
    console.log('MongoDB connected for login');

    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email và password là bắt buộc'
      }, { status: 400 });
    }

    console.log('Login attempt for email:', email);

    // Check if AccountModel exists and test basic query
    try {
      const totalUsers = await AccountModel.countDocuments();
      console.log('Total users in database:', totalUsers);
      
      if (totalUsers === 0) {
        console.log('No users found in database');
        return NextResponse.json({
          success: false,
          message: 'No users in database. Please create users first.'
        }, { status: 404 });
      }
      
      // List first few users for debugging
      const allUsers = await AccountModel.find({}, 'email fullname status').limit(5).lean();
      console.log('Sample users in DB:', allUsers);
      
    } catch (modelError) {
      console.error('AccountModel error:', modelError);
      return NextResponse.json({
        success: false,
        message: 'Database model error: ' + (modelError as Error).message
      }, { status: 500 });
    }

    // Find user by email
    console.log('Searching for user with email:', email.toLowerCase());
    
    const user = await AccountModel.findOne({ 
      email: email.toLowerCase(),
      status: 'active'  // Changed from isActive to status
    }).select('+password').lean() as any;  // Added .select('+password') to include password field
    
    if (!user) {
      console.log('User not found with status=active filter. Trying without filter...');
      
      // Try without status filter
      const userWithoutFilter = await AccountModel.findOne({ 
        email: email.toLowerCase()
      }).select('+password').lean() as any;  // Added .select('+password') to include password field
      
      if (userWithoutFilter) {
        console.log('User found but status:', userWithoutFilter.status);
        console.log('User data:', { 
          email: userWithoutFilter.email, 
          fullname: userWithoutFilter.fullname,  // Changed from name to fullname
          status: userWithoutFilter.status 
        });
        
        // Check password
        if (userWithoutFilter.password === password) {
          console.log('Password matches, logging in despite status');
          
          return NextResponse.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
              _id: userWithoutFilter._id.toString(),
              id: userWithoutFilter._id.toString(),
              email: userWithoutFilter.email,
              name: userWithoutFilter.fullname,
              fullname: userWithoutFilter.fullname,
              phone: userWithoutFilter.phone || '',
              address: userWithoutFilter.address || '',
              bio: userWithoutFilter.bio || '',
              location: userWithoutFilter.location || null,
              role: userWithoutFilter.role || 'user',
              avatar: userWithoutFilter.avatar || null,
              status: userWithoutFilter.status || 'unverified',
              isVerified: userWithoutFilter.verifications?.length > 0 || false
            }
          });
        } else {
          console.log('Password mismatch. DB password:', userWithoutFilter.password, 'Input password:', password);
        }
      }
      
      console.log('User not found:', email);
      return NextResponse.json({
        success: false,
        message: 'Email hoặc password không đúng'
      }, { status: 401 });
    }

    // Simple password check (in production, use bcrypt)
    console.log('Checking password for user:', user.email);
    console.log('DB password:', user.password, 'Input password:', password);
    
    if (user.password !== password) {
      console.log('Invalid password for user:', email);
      return NextResponse.json({
        success: false,
        message: 'Email hoặc password không đúng'
      }, { status: 401 });
    }

    console.log('Login successful for user:', email);

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: user.fullname,
        fullname: user.fullname,
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        location: user.location || null,
        role: user.role || 'user',
        avatar: user.avatar || null,
        status: user.status || 'unverified',
        isVerified: user.verifications?.length > 0 || false
      }
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Login API is working',
    demo_accounts: [
      { email: 'admin@vshare.com', password: '123456' },
      { email: 'user@vshare.com', password: '123456' },
      { email: 'demo@vshare.com', password: 'demo123' }
    ],
    instructions: 'Use POST /api/seed-users to create demo users first'
  });
}