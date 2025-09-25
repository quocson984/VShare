import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';
import { EquipmentModel } from '@/models/equipment';
import { BookingModel } from '@/models/booking';

export async function GET() {
  try {
    await connectMongoDB();
    
    // Test creating sample data
    const sampleAccount = {
      email: 'admin@vshare.com',
      password: 'hashedPassword123',
      nickname: 'Admin User',
      role: 'admin',
      status: 'active'
    };

    // Check if account already exists
    const existingAccount = await AccountModel.findOne({ email: sampleAccount.email });
    
    let account;
    if (!existingAccount) {
      account = await AccountModel.create(sampleAccount);
      console.log('✅ Sample account created');
    } else {
      account = existingAccount;
      console.log('ℹ️ Account already exists');
    }

    // Test equipment with proper ObjectId reference
    const sampleEquipment = {
      title: 'Canon EOS R5 Camera',
      brand: 'Canon',
      model: 'EOS R5',
      description: 'Professional mirrorless camera with 45MP sensor',
      category: 'camera',
      pricePerDay: 500000,
      pricePerWeek: 3000000,
      pricePerMonth: 10000000,
      replacementPrice: 90000000,
      deposit: 5000000,
      ownerId: account._id, // Use ObjectId reference
      specs: [
        { name: 'Resolution', value: '45MP' },
        { name: 'Sensor', value: 'Full Frame CMOS' },
        { name: 'ISO', value: '100-51200' }
      ]
    };

    const existingEquipment = await EquipmentModel.findOne({ title: sampleEquipment.title });
    
    let equipment;
    if (!existingEquipment) {
      equipment = await EquipmentModel.create(sampleEquipment);
      console.log('✅ Sample equipment created');
    } else {
      equipment = existingEquipment;
      console.log('ℹ️ Equipment already exists');
    }

    // Get counts
    const accountCount = await AccountModel.countDocuments();
    const equipmentCount = await EquipmentModel.countDocuments();
    const bookingCount = await BookingModel.countDocuments();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        counts: {
          accounts: accountCount,
          equipment: equipmentCount,
          bookings: bookingCount
        },
        sampleData: {
          account: {
            id: account._id,
            email: account.email,
            nickname: account.nickname,
            role: account.role
          },
          equipment: {
            id: equipment._id,
            title: equipment.title,
            brand: equipment.brand,
            pricePerDay: equipment.pricePerDay,
            owner: equipment.ownerId
          }
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}