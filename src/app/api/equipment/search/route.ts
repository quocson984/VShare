import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build search filter
    const filter: Record<string, any> = {
      status: 'available'
    };

    // Text search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Location search (if coordinates are provided)
    if (location) {
      // For text-based location search
      filter['location.address'] = { $regex: location, $options: 'i' };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Brand filter
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    // Price range filter
    filter.pricePerDay = {
      $gte: minPrice,
      $lte: maxPrice
    };

    // Build sort object
    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [equipment, total] = await Promise.all([
      EquipmentModel
        .find(filter)
        .populate('ownerId', 'personalInfo.firstName personalInfo.lastName verification.verificationLevel')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      EquipmentModel.countDocuments(filter)
    ]);

    // Transform data for frontend
    const transformedEquipment = equipment.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      brand: item.brand,
      model: item.model,
      category: item.category,
      description: item.description,
      images: item.images || [],
      pricePerDay: item.pricePerDay,
      pricePerWeek: item.pricePerWeek,
      pricePerMonth: item.pricePerMonth,
      location: {
        coordinates: item.location?.coordinates || [0, 0],
        address: item.location?.address || 'Chưa cập nhật'
      },
      owner: {
        name: item.ownerId ? 
          `${item.ownerId.personalInfo?.firstName || ''} ${item.ownerId.personalInfo?.lastName || ''}`.trim() : 
          'Unknown',
        verified: item.ownerId?.verification?.verificationLevel === 'verified',
        badges: item.ownerId?.verification?.verificationLevel === 'verified' ? ['Verified'] : []
      },
      rating: 4.5, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Count from reviews
      availability: 'available',
      instantBook: true, // TODO: Add to schema
      deliveryOptions: ['pickup'], // TODO: Add to schema
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        equipment: transformedEquipment,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Equipment search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search equipment' 
      },
      { status: 500 }
    );
  }
}