import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipment = await EquipmentModel.findById(params.id)
      .populate('owner', 'name avatar rating reviewCount joinedDate')
      .lean();

    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      }, { status: 404 });
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
      images: equipment.images || [],
      availability: equipment.availability,
      location: equipment.location,
      owner: {
        _id: equipment.owner._id.toString(),
        name: equipment.owner.name,
        avatar: equipment.owner.avatar || null,
        rating: equipment.owner.rating || 4.8,
        reviewCount: equipment.owner.reviewCount || 0,
        joinedDate: equipment.owner.joinedDate || new Date().toISOString()
      },
      specifications: equipment.specifications || {},
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