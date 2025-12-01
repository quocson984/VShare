import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';

export async function POST(request: NextRequest) {
  try {
    console.log('Register API called');
    
    // Connect to MongoDB
    await connectMongoDB();
    console.log('MongoDB connected for register');

    const formData = await request.formData();
    
    // Extract form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullname = formData.get('fullname') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const avatar = formData.get('avatar') as File;
    const frontCccd = formData.get('frontCccd') as File;
    const backCccd = formData.get('backCccd') as File;
    const selfie = formData.get('selfie') as File;
    const identityNumber = formData.get('identityNumber') as string;
    const identityFullname = formData.get('identityFullname') as string;

    // Validate required fields
    if (!email || !password || !fullname) {
      return NextResponse.json({
        success: false,
        message: 'Email, password và họ tên là bắt buộc'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Email không hợp lệ'
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await AccountModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email đã được sử dụng'
      }, { status: 409 });
    }

    let avatarUrl = null;
    let frontCccdUrl = null;
    let backCccdUrl = null;
    let selfieUrl = null;

    // Helper function to upload image to ImgBB
    const uploadImageToImgBB = async (file: File, name: string): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');

      const imgbbApiKey = process.env.IMGBB_API_KEY || 'e5a26aff5dadb562538eabc1fb49700';
      
      const imgbbFormData = new FormData();
      imgbbFormData.append('key', imgbbApiKey);
      imgbbFormData.append('image', base64Image);
      imgbbFormData.append('name', `${name}_${Date.now()}_${file.name}`);

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: imgbbFormData
      });

      const imgbbData = await imgbbResponse.json();

      if (!imgbbData.success) {
        throw new Error('Lỗi upload hình ảnh: ' + (imgbbData.error?.message || 'Unknown error'));
      }

      return imgbbData.data.url;
    };

    // Handle avatar upload if provided
    if (avatar && avatar.size > 0) {
      console.log('Processing avatar upload');
      
      // Validate file type
      if (!avatar.type.startsWith('image/')) {
        return NextResponse.json({
          success: false,
          message: 'File avatar phải là hình ảnh'
        }, { status: 400 });
      }

      // Validate file size (max 32MB as per ImgBB limit)
      if (avatar.size > 32 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          message: 'File avatar quá lớn (tối đa 32MB)'
        }, { status: 400 });
      }

      try {
        avatarUrl = await uploadImageToImgBB(avatar, 'avatar');
        console.log('Avatar uploaded successfully:', avatarUrl);
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        return NextResponse.json({
          success: false,
          message: 'Lỗi upload avatar: ' + errorMessage
        }, { status: 500 });
      }
    }

    // Handle identity document uploads
    try {
      if (frontCccd && frontCccd.size > 0) {
        if (!frontCccd.type.startsWith('image/')) {
          return NextResponse.json({
            success: false,
            message: 'File mặt trước CCCD phải là hình ảnh'
          }, { status: 400 });
        }
        if (frontCccd.size > 32 * 1024 * 1024) {
          return NextResponse.json({
            success: false,
            message: 'File mặt trước CCCD quá lớn (tối đa 32MB)'
          }, { status: 400 });
        }
        frontCccdUrl = await uploadImageToImgBB(frontCccd, 'front_cccd');
      }

      if (backCccd && backCccd.size > 0) {
        if (!backCccd.type.startsWith('image/')) {
          return NextResponse.json({
            success: false,
            message: 'File mặt sau CCCD phải là hình ảnh'
          }, { status: 400 });
        }
        if (backCccd.size > 32 * 1024 * 1024) {
          return NextResponse.json({
            success: false,
            message: 'File mặt sau CCCD quá lớn (tối đa 32MB)'
          }, { status: 400 });
        }
        backCccdUrl = await uploadImageToImgBB(backCccd, 'back_cccd');
      }

      if (selfie && selfie.size > 0) {
        if (!selfie.type.startsWith('image/')) {
          return NextResponse.json({
            success: false,
            message: 'File ảnh chân dung phải là hình ảnh'
          }, { status: 400 });
        }
        if (selfie.size > 32 * 1024 * 1024) {
          return NextResponse.json({
            success: false,
            message: 'File ảnh chân dung quá lớn (tối đa 32MB)'
          }, { status: 400 });
        }
        selfieUrl = await uploadImageToImgBB(selfie, 'selfie');
      }
    } catch (uploadError) {
      console.error('Identity document upload error:', uploadError);
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      return NextResponse.json({
        success: false,
        message: 'Lỗi upload tài liệu xác minh: ' + errorMessage
      }, { status: 500 });
    }

    // Create new user
    const newUser = new AccountModel({
      email: email.toLowerCase(),
      password: password, // In production, hash this password with bcrypt
      fullname: fullname.trim(),
      phone: phone || null,
      address: address || null,
      avatar: avatarUrl,
      identityNumber: identityNumber || null,
      identityFullname: identityFullname || null,
      identityImages: [frontCccdUrl, backCccdUrl, selfieUrl].filter(Boolean),
      role: 'user', // All new accounts are 'user' and can rent or list equipment
      status: 'unverified',
      credit: 'trusted',
      wallet: 0,
      verifications: [{
        status: 'pending',
        frontCccd: frontCccdUrl,
        backCccd: backCccdUrl,
        selfie: selfieUrl,
        notes: 'Đăng ký mới - chờ xác minh'
      }]
    });

    const savedUser = await newUser.save();
    console.log('User registered successfully:', savedUser.email);

    // Return user data (without password)
    const userResponse = {
      _id: savedUser._id.toString(),
      id: savedUser._id.toString(),
      email: savedUser.email,
      fullname: savedUser.fullname,
      name: savedUser.fullname,
      phone: savedUser.phone,
      address: savedUser.address,
      bio: savedUser.bio || '',
      location: savedUser.location || null,
      avatar: savedUser.avatar,
      role: savedUser.role,
      status: savedUser.status,
      credit: savedUser.credit,
      wallet: savedUser.wallet,
      isVerified: savedUser.verifications?.length > 0 || false,
      createdAt: savedUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công',
      user: userResponse
    }, { status: 201 });

  } catch (error: any) {
    console.error('Register API error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({
        success: false,
        message: `${field} đã được sử dụng`
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Lỗi server khi đăng ký',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Register API is working',
    instructions: {
      method: 'POST',
      contentType: 'multipart/form-data',
      requiredFields: ['email', 'password', 'fullname'],
      optionalFields: ['phone', 'address', 'avatar'],
      avatarUpload: {
        maxSize: '32MB',
        supportedFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'WebP'],
        field: 'avatar'
      }
    }
  });
}
