import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { AccountModel } from '@/models/account';
import { EquipmentModel } from '@/models/equipment';
import { InsuranceModel } from '@/models/insurance';

export async function GET() {
  try {
    await connectMongoDB();
    console.log('✅ MongoDB connected successfully');

    // --- 1️⃣ Ensure 4 accounts exist ---
    const accountsData = [
      {
        email: 'admin@example.com',
        password: 'AdminPass123!',
        fullname: 'System Admin',
        role: 'admin',
        status: 'active'
      },
      {
        email: 'moderator@example.com',
        password: 'ModPass123!',
        fullname: 'Site Moderator',
        role: 'moderator',
        status: 'active'
      },
      {
        email: 'owner@example.com',
        password: 'OwnerPass123!',
        fullname: 'John Owner',
        role: 'owner',
        status: 'active'
      },
      {
        email: 'renter@example.com',
        password: 'RenterPass123!',
        fullname: 'Jane Renter',
        role: 'renter',
        status: 'active'
      }
    ];

    for (const data of accountsData) {
      const exists = await AccountModel.findOne({ email: data.email });
      if (!exists) {
        await AccountModel.create(data);
        console.log(`✅ Created account: ${data.email}`);
      }
    }

    const [admin, moderator, owner, renter] = await Promise.all([
      AccountModel.findOne({ role: 'admin' }),
      AccountModel.findOne({ role: 'moderator' }),
      AccountModel.findOne({ role: 'owner' }),
      AccountModel.findOne({ role: 'renter' })
    ]);

    if (!owner) throw new Error('Owner account not found!');

    // --- 2️⃣ Ensure 5 sample equipment for owner ---
    const equipments = [
      {
        title: 'Canon EOS R5 Mirrorless Camera',
        brand: 'Canon',
        model: 'EOS R5',
        description: 'High-end mirrorless camera ideal for professional work.',
        category: 'camera',
        quantity: 2,
        pricePerDay: 80000,
        pricePerWeek: 500000,
        pricePerMonth: 1800000,
        replacementPrice: 3500000,
        deposit: 300000,
        location: { city: 'Hanoi', country: 'Vietnam', address: '123 Nguyen Trai' },
        specs: [
          { name: 'Resolution', value: '45MP' },
          { name: 'Video', value: '8K UHD' }
        ]
      },
      {
        title: 'Sony FE 24-70mm f/2.8 GM Lens',
        brand: 'Sony',
        model: 'SEL2470GM',
        description: 'Professional zoom lens for Sony cameras.',
        category: 'lens',
        quantity: 3,
        pricePerDay: 40000,
        pricePerWeek: 250000,
        pricePerMonth: 900000,
        replacementPrice: 2200000,
        deposit: 150000,
        location: { city: 'Ho Chi Minh City', country: 'Vietnam', address: '456 Le Loi' },
        specs: [
          { name: 'Aperture', value: 'f/2.8' },
          { name: 'Mount', value: 'E-mount' }
        ]
      },
      {
        title: 'Godox SL60W LED Light',
        brand: 'Godox',
        model: 'SL60W',
        description: 'Bright LED lighting for studio or field shoots.',
        category: 'lighting',
        quantity: 5,
        pricePerDay: 20000,
        pricePerWeek: 120000,
        pricePerMonth: 400000,
        replacementPrice: 500000,
        deposit: 50000,
        location: { city: 'Da Nang', country: 'Vietnam', address: '789 Hai Phong' },
        specs: [
          { name: 'Power', value: '60W' },
          { name: 'Color Temperature', value: '5600K' }
        ]
      },
      {
        title: 'Rode NTG5 Microphone',
        brand: 'Rode',
        model: 'NTG5',
        description: 'Broadcast-quality shotgun microphone for film use.',
        category: 'audio',
        quantity: 4,
        pricePerDay: 25000,
        pricePerWeek: 150000,
        pricePerMonth: 500000,
        replacementPrice: 600000,
        deposit: 60000,
        location: { city: 'Hanoi', country: 'Vietnam', address: '321 Kim Ma' },
        specs: [
          { name: 'Frequency Range', value: '20Hz–20kHz' },
          { name: 'Weight', value: '76g' }
        ]
      },
      {
        title: 'Manfrotto 504X Tripod Kit',
        brand: 'Manfrotto',
        model: '504X',
        description: 'Lightweight tripod with smooth fluid head for stable shots.',
        category: 'accessory',
        quantity: 6,
        pricePerDay: 15000,
        pricePerWeek: 90000,
        pricePerMonth: 300000,
        replacementPrice: 700000,
        deposit: 40000,
        location: { city: 'Hue', country: 'Vietnam', address: '99 Le Duan' },
        specs: [
          { name: 'Max Height', value: '173 cm' },
          { name: 'Weight Capacity', value: '12 kg' }
        ]
      }
    ];

    for (const item of equipments) {
      const exists = await EquipmentModel.findOne({ title: item.title });
      if (!exists) {
        await EquipmentModel.create({ ...item, ownerId: owner._id });
        console.log(`✅ Created equipment: ${item.title}`);
      }
    }

    // --- 3️⃣ Ensure 3 insurance packages ---
    const insurances = [
      {
        name: 'Basic Coverage',
        description: 'Basic protection up to $5,000 coverage. Ideal for low-risk rentals.',
        minCoverage: 1000000,
        maxCoverage: 5000000,
        status: 'active'
      },
      {
        name: 'Standard Coverage',
        description: 'Covers most rentals up to $20,000 including accidental damage and theft.',
        minCoverage: 8000000,
        maxCoverage: 15000000,
        status: 'active'
      },
      {
        name: 'Premium Coverage',
        description: 'Full protection for professional gear up to $100,000 with fast claims.',
        minCoverage: 20000000,
        maxCoverage: 50000000,
        status: 'active'
      }
    ];

    for (const pkg of insurances) {
      const exists = await InsuranceModel.findOne({ name: pkg.name });
      if (!exists) {
        await InsuranceModel.create(pkg);
        console.log(`✅ Created insurance: ${pkg.name}`);
      }
    }

    // --- 4️⃣ Get counts ---
    const [accountCount, equipmentCount, insuranceCount] = await Promise.all([
      AccountModel.countDocuments(),
      EquipmentModel.countDocuments(),
      InsuranceModel.countDocuments()
    ]);

    // --- 5️⃣ Return response ---
    const allAccounts = await AccountModel.find({}, 'email role fullname status');
    const allEquipment = await EquipmentModel.find({}, 'title category pricePerDay ownerId');
    const allInsurance = await InsuranceModel.find({}, 'name minCoverage maxCoverage status');

    return NextResponse.json({
      success: true,
      message: '✅ Database connected and all seed data verified.',
      data: {
        counts: {
          accounts: accountCount,
          equipment: equipmentCount,
          insurances: insuranceCount
        },
        accounts: allAccounts,
        equipment: allEquipment,
        insurances: allInsurance
      }
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
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
