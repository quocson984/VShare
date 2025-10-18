import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipment = await EquipmentModel.findById(params.id).lean();

    if (!equipment) {
      // Return mock equipment if not found in database
      const mockEquipment = {
        _id: params.id,
        title: 'Canon EOS R5 Camera',
        description: 'Máy ảnh full-frame chuyên nghiệp với độ phân giải cao 45MP. Thích hợp cho chụp ảnh cưới, sự kiện, và nhiếp ảnh chuyên nghiệp.',
        category: 'camera',
        pricePerDay: 500000,
        rating: 4.8,
        reviewCount: 15,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=800&h=600&fit=crop'
        ],
        availability: 'available',
        location: {
          address: 'Quận 1, TP.HCM',
          coordinates: [106.6820, 10.7629]
        },
        owner: {
          _id: 'mock-owner-1',
          name: 'Nguyễn Văn A',
          avatar: null,
          rating: 4.9,
          reviewCount: 25,
          joinedDate: new Date('2023-01-01').toISOString()
        },
        specifications: {
          'Độ phân giải': '45MP',
          'Cảm biến': 'Full-frame CMOS',
          'Video': '8K RAW, 4K 120fps',
          'Ống kính': 'RF Mount',
          'Pin': 'LP-E6NH'
        },
        policies: {
          cancellation: 'Hủy miễn phí trong 24 giờ đầu',
          usage: 'Sử dụng cẩn thận và trả về đúng hạn',
          damage: 'Bồi thường 100% giá trị thiết bị nếu hư hỏng'
        }
      };

      return NextResponse.json({
        success: true,
        data: mockEquipment
      });
    }

    // Transform the data for frontend
    const transformedEquipment = {
      _id: equipment._id.toString(),
      title: equipment.title,
      description: equipment.description,
      category: equipment.category,
      pricePerDay: equipment.pricePerDay,
      rating: equipment.rating || 4.5,
      reviewCount: equipment.reviewCount || 0,
      images: equipment.images || ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop'],
      availability: equipment.availability || 'available',
      location: equipment.location || {
        address: 'TP.HCM',
        coordinates: [106.6820, 10.7629]
      },
      owner: {
        _id: 'mock-owner',
        name: 'Equipment Owner',
        avatar: null,
        rating: 4.8,
        reviewCount: 10,
        joinedDate: new Date().toISOString()
      },
      specifications: equipment.specifications || {
        'Thương hiệu': equipment.brand || 'N/A',
        'Model': equipment.model || 'N/A',
        'Tình trạng': 'Mới 95%'
      },
      policies: equipment.policies || {
        cancellation: 'Hủy miễn phí trong 24 giờ đầu',
        usage: 'Sử dụng cẩn thận và trả về đúng hạn',
        damage: 'Bồi thường 100% giá trị thiết bị nếu hư hỏng'
      }
    };

    return NextResponse.json({
      success: true,
      data: transformedEquipment
    });

  } catch (error) {
    console.error('Equipment detail API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi server khi tải thông tin thiết bị'
    }, { status: 500 });
  }
}