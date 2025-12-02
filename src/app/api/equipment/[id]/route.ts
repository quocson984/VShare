import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';
import { AccountModel } from '@/models/account';
import type { EquipmentType } from '@/models/equipment';

const FALLBACK_OWNER_ID = '000000000000000000000001';

type EquipmentDetail = EquipmentType & {
  rating?: number;
  reviewCount?: number;
  availability?: string;
  policies?: {
    cancellation?: string;
    usage?: string;
    damage?: string;
    deposit?: number;
  };
  specifications?: Record<string, string>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipment = (await EquipmentModel.findById(params.id).lean()) as EquipmentDetail | null;

    // Debug: Log location data from database
    if (equipment) {
      console.log('Equipment from DB - location:', equipment.location);
    }

    // Get viewer ID from query params to check if they're the owner
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get('viewerId');

    // Allow access if: equipment exists AND (it's available OR viewer is the owner)
    const isOwner = viewerId && equipment?.ownerId?.toString() === viewerId;
    
    if (!equipment || (equipment.status === 'unavailable' && !isOwner)) {
      // Return mock equipment if not found in database or unavailable for non-owners
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
        ownerId: FALLBACK_OWNER_ID,
        replacementPrice: 2800000,
        deposit: 550000,
        owner: {
          _id: FALLBACK_OWNER_ID,
          name: 'Equipment Owner',
          avatar: null,
          credit: 'trusted',
          status: 'active'
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
      _id: String(equipment._id ?? params.id),
      title: equipment.title,
      brand: equipment.brand,
      description: equipment.description,
      category: equipment.category,
      quantity: equipment.quantity || 1,
      serialNumbers: equipment.serialNumbers || [],
      images: equipment.images || [],
      specs: equipment.specs || [],
      status: equipment.status || 'available',
      prices: {
        perDay: equipment.pricePerDay,
        perWeek: equipment.pricePerWeek,
        perMonth: equipment.pricePerMonth
      },
      pricePerDay: equipment.pricePerDay,
      replacementPrice: equipment.replacementPrice || equipment.pricePerDay * 10,
      rating: equipment.rating || 4.5,
      reviewCount: equipment.reviewCount || 0,
      availability: equipment.availability || 'available',
      location: await (async () => {
        // Always use owner's location
        try {
          const ownerData = await AccountModel.findById(equipment.ownerId).select('location address').lean();
          if (ownerData && ownerData.location && ownerData.location.coordinates && ownerData.location.coordinates.length === 2) {
            console.log('✅ Using owner location:', ownerData.location);
            return {
              type: 'Point',
              address: ownerData.location.address || ownerData.address || 'TP.HCM',
              coordinates: ownerData.location.coordinates,
              district: ownerData.location.district,
              city: ownerData.location.city,
              country: ownerData.location.country || 'Vietnam'
            };
          }
          console.log('⚠️ Owner has no location, using fallback');
        } catch (err) {
          console.error('❌ Error fetching owner location:', err);
        }
        
        // Fallback to HCMC default
        return {
          address: 'TP.HCM',
          coordinates: [106.6297, 10.8231]
        };
      })(),
      ownerId: equipment.ownerId?.toString() || FALLBACK_OWNER_ID,
      deposit: equipment.deposit ?? equipment.policies?.deposit ?? 0,
      owner: await (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ownerData: any = await AccountModel.findById(equipment.ownerId).lean();
          if (ownerData) {
            return {
              _id: ownerData._id.toString(),
              name: ownerData.fullname || ownerData.email || 'Equipment Owner',
              avatar: ownerData.avatar || null,
              credit: ownerData.credit || 'restricted',
              status: ownerData.status || 'unverified'
            };
          }
        } catch (err) {
          console.error('Error fetching owner data:', err);
        }
        return {
          _id: equipment.ownerId?.toString() || FALLBACK_OWNER_ID,
          name: 'Equipment Owner',
          avatar: null,
          credit: 'restricted',
          status: 'unverified'
        };
      })(),
      specifications: equipment.specs?.reduce((acc: Record<string, string>, spec: { name: string; value: string }) => {
        acc[spec.name] = spec.value;
        return acc;
      }, {} as Record<string, string>) || {},
      specs: equipment.specs || [],
      policies: equipment.policies || {
        cancellation: 'Hủy miễn phí trong 24 giờ đầu',
        usage: 'Sử dụng cẩn thận và trả về đúng hạn',
        damage: 'Bồi thường 100% giá trị thiết bị nếu hư hỏng'
      }
    };

    return NextResponse.json({
      success: true,
      equipment: transformedEquipment
    });

  } catch (error) {
    console.error('Equipment detail API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi server khi tải thông tin thiết bị'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const formData = await request.formData();
    
    // Extract form data
    const title = formData.get('title') as string;
    const brand = formData.get('brand') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const pricePerDay = parseFloat(formData.get('pricePerDay') as string);
    const pricePerWeek = parseFloat(formData.get('pricePerWeek') as string) || 0;
    const pricePerMonth = parseFloat(formData.get('pricePerMonth') as string) || 0;
    const replacementPrice = parseFloat(formData.get('replacementPrice') as string);
    const status = formData.get('status') as string;
    
    // Serial numbers (JSON string)
    const serialNumbersData = formData.get('serialNumbers') as string;
    let serialNumbers: string[] = [];
    if (serialNumbersData) {
      try {
        serialNumbers = JSON.parse(serialNumbersData);
      } catch (e) {
        console.error('Error parsing serialNumbers:', e);
      }
    }
    
    // Images (JSON string of URLs)
    const imagesData = formData.get('images') as string;
    let images: string[] = [];
    if (imagesData) {
      try {
        images = JSON.parse(imagesData);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }
    
    // Specs data (JSON string)
    const specsData = formData.get('specs') as string;
    let specs = [];
    if (specsData) {
      try {
        specs = JSON.parse(specsData);
      } catch (e) {
        console.error('Error parsing specs:', e);
      }
    }

    // Validate required fields
    if (!title || !category || !quantity || !pricePerDay || !replacementPrice) {
      return NextResponse.json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['camera', 'lens', 'lighting', 'audio', 'accessory'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        message: 'Danh mục không hợp lệ'
      }, { status: 400 });
    }

    // Get current equipment to find owner
    const currentEquipment = await EquipmentModel.findById(params.id);
    if (!currentEquipment) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      }, { status: 404 });
    }

    // Get owner's location
    const owner = await AccountModel.findById(currentEquipment.ownerId).select('location address');
    let equipmentLocation;
    if (owner?.location && owner.location.coordinates && owner.location.coordinates.length === 2) {
      equipmentLocation = {
        type: 'Point',
        address: owner.location.address || owner.address || 'TP.HCM',
        coordinates: owner.location.coordinates,
        district: owner.location.district,
        city: owner.location.city,
        country: owner.location.country || 'Vietnam'
      };
    } else {
      // Keep existing location or use default
      equipmentLocation = currentEquipment.location || {
        type: 'Point',
        address: owner?.address || 'TP.HCM',
        coordinates: [106.6297, 10.8231]
      };
    }

    // Update equipment
    const updateData: any = {
      title: title.trim(),
      brand: brand?.trim() || '',
      description: description?.trim() || '',
      category,
      quantity,
      serialNumbers,
      images,
      specs,
      pricePerDay,
      pricePerWeek: pricePerWeek || undefined,
      pricePerMonth: pricePerMonth || undefined,
      replacementPrice,
      status: status || 'available',
      location: equipmentLocation,
      updatedAt: new Date()
    };

    const equipment = await EquipmentModel.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy thiết bị'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thiết bị thành công',
      equipment
    });

  } catch (error) {
    console.error('Equipment update API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi server khi cập nhật thiết bị'
    }, { status: 500 });
  }
}