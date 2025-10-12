import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';
import mongoose from 'mongoose';

const sampleEquipment = [
  {
    title: "Canon EOS R5 Camera",
    brand: "Canon",
    model: "EOS R5",
    description: "Máy ảnh mirrorless chuyên nghiệp 45MP với video 8K",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop"],
    category: "camera",
    quantity: 1,
    location: {
      type: "Point",
      coordinates: [106.6297, 10.8231], // [longitude, latitude] - Ho Chi Minh City
      address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
      district: "Quận 7",
      city: "TP.HCM",
      country: "Vietnam"
    },
    specs: [
      { name: "Độ phân giải", value: "45MP" },
      { name: "Video", value: "8K RAW" },
      { name: "ISO", value: "100-51200" }
    ],
    pricePerDay: 450000,
    pricePerWeek: 2700000,
    pricePerMonth: 9000000,
    replacementPrice: 95000000,
    deposit: 5000000,
    status: "available",
    ownerId: new mongoose.Types.ObjectId() // Temporary ObjectId
  },
  {
    title: "Sony FX6 Cinema Camera",
    brand: "Sony",
    model: "FX6",
    description: "Camera điện ảnh chuyên nghiệp với cảm biến Full-frame",
    images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop"],
    category: "camera",
    quantity: 1,
    location: {
      type: "Point",
      coordinates: [106.7009, 10.7769], // Quận 3, HCM
      address: "456 Pasteur, Quận 3, TP.HCM",
      district: "Quận 3", 
      city: "TP.HCM",
      country: "Vietnam"
    },
    specs: [
      { name: "Cảm biến", value: "Full-frame" },
      { name: "Video", value: "4K 120fps" },
      { name: "Codec", value: "XAVC-I" }
    ],
    pricePerDay: 600000,
    pricePerWeek: 3600000,
    pricePerMonth: 12000000,
    replacementPrice: 150000000,
    deposit: 8000000,
    status: "available",
    ownerId: new mongoose.Types.ObjectId()
  },
  {
    title: "DJI Ronin RS3 Gimbal",
    brand: "DJI",
    model: "Ronin RS3",
    description: "Gimbal 3 trục chuyên nghiệp cho camera DSLR/Mirrorless",
    images: ["https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop"],
    category: "accessory",
    quantity: 2,
    location: {
      type: "Point",
      coordinates: [106.7191, 10.7427], // Quận 7, HCM
      address: "789 Nguyễn Hữu Thọ, Quận 7, TP.HCM", 
      district: "Quận 7",
      city: "TP.HCM",
      country: "Vietnam"
    },
    specs: [
      { name: "Tải trọng", value: "4.5kg" },
      { name: "Thời gian pin", value: "12 giờ" },
      { name: "Điều khiển", value: "App/Remote" }
    ],
    pricePerDay: 200000,
    pricePerWeek: 1200000,
    pricePerMonth: 4000000,
    replacementPrice: 18000000,
    deposit: 2000000,
    status: "available", 
    ownerId: new mongoose.Types.ObjectId()
  },
  {
    title: "Nikon Z6 II Camera",
    brand: "Nikon",
    model: "Z6 II", 
    description: "Máy ảnh mirrorless đa năng với ống kính kit 24-70mm",
    images: ["https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop"],
    category: "camera",
    quantity: 1,
    location: {
      type: "Point", 
      coordinates: [106.6816, 10.7758], // Quận 1, HCM
      address: "321 Lê Lợi, Quận 1, TP.HCM",
      district: "Quận 1",
      city: "TP.HCM", 
      country: "Vietnam"
    },
    specs: [
      { name: "Độ phân giải", value: "24.5MP" },
      { name: "Video", value: "4K UHD" },
      { name: "Chống rung", value: "5-axis VR" }
    ],
    pricePerDay: 350000,
    pricePerWeek: 2100000,
    pricePerMonth: 7000000,
    replacementPrice: 65000000,
    deposit: 4000000,
    status: "available",
    ownerId: new mongoose.Types.ObjectId()
  },
  {
    title: "Aputure 300D II Lighting Kit",
    brand: "Aputure",
    model: "300D II",
    description: "Bộ đèn LED chuyên nghiệp 300W với softbox và stand",
    images: ["https://images.unsplash.com/photo-1558618047-3c8c76c830c3?w=400&h=400&fit=crop"],
    category: "lighting",
    quantity: 1,
    location: {
      type: "Point",
      coordinates: [106.6602, 10.8142], // Tân Phú, HCM
      address: "654 Cộng Hòa, Tân Phú, TP.HCM",
      district: "Tân Phú",
      city: "TP.HCM",
      country: "Vietnam"
    },
    specs: [
      { name: "Công suất", value: "300W" },
      { name: "CRI", value: "96+" },
      { name: "Điều khiển", value: "App/DMX" }
    ],
    pricePerDay: 300000,
    pricePerWeek: 1800000,
    pricePerMonth: 6000000,
    replacementPrice: 25000000,
    deposit: 3000000,
    status: "available",
    ownerId: new mongoose.Types.ObjectId()
  }
];

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    // Clear existing equipment
    await EquipmentModel.deleteMany({});
    
    // Insert sample equipment
    const insertedEquipment = await EquipmentModel.insertMany(sampleEquipment);
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${insertedEquipment.length} equipment items`,
      data: {
        count: insertedEquipment.length,
        equipment: insertedEquipment.map(item => ({
          id: item._id,
          title: item.title,
          location: item.location.address,
          coordinates: item.location.coordinates
        }))
      }
    });
    
  } catch (error) {
    console.error('Seed equipment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed equipment data' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();
    
    const count = await EquipmentModel.countDocuments();
    const equipment = await EquipmentModel.find({}).limit(10).lean();
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: count,
        sampleEquipment: equipment.map(item => ({
          id: item._id,
          title: item.title,
          location: item.location?.address,
          coordinates: item.location?.coordinates
        }))
      }
    });
    
  } catch (error) {
    console.error('Get equipment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get equipment data' 
      },
      { status: 500 }
    );
  }
}