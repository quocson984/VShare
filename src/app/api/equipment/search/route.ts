import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

interface PopulatedOwner {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
  };
  verification?: {
    verificationLevel?: string;
  };
}

interface LeanEquipment {
  _id: string;
  title: string;
  brand?: string;
  model?: string;
  category: string;
  description?: string;
  images?: string[];
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  location?: {
    coordinates?: [number, number];
    address?: string;
  };
  ownerId?: PopulatedOwner;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchFilter {
  status?: string;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  $and?: Array<{ $or: Array<Record<string, { $regex: string; $options: string }>> }>;
  'location.address'?: { $regex: string; $options: string };
  'location.coordinates'?: {
    $geoWithin?: {
      $centerSphere: [[number, number], number];
    };
  };
  category?: string;
  brand?: { $regex: string; $options: string };
  pricePerDay?: { $gte: number; $lte: number };
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '0'); // in kilometers
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build search filter
    const filter: SearchFilter = {
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

    // Location search - improved for better matching
    if (location) {
      // Try multiple location fields for better matching
      filter.$or = filter.$or || [];
      const locationFilter = [
        { 'location.address': { $regex: location, $options: 'i' } },
        { 'location.district': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } }
      ];
      
      // If we already have $or from text search, combine them
      if (filter.$or.length > 0) {
        filter.$and = [
          { $or: filter.$or },
          { $or: locationFilter }
        ];
        delete filter.$or;
      } else {
        filter.$or = locationFilter;
      }
    }

    // Coordinate-based search (geospatial search) - Takes priority over text location search
    if (lat && lng && radius && lat !== 0 && lng !== 0 && radius > 0) {
      console.log(`Performing coordinate search: lat=${lat}, lng=${lng}, radius=${radius}km`);
      
      // Start fresh for coordinate search
      const coordFilter: SearchFilter = {
        status: 'available'
      };
      
      // Keep text search if exists
      if (query) {
        coordFilter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { brand: { $regex: query, $options: 'i' } },
          { model: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Add geospatial search - ensure coordinates exist and are valid
      // MongoDB expects [longitude, latitude] format
      const radiusInRadians = radius / 6378.1; // Earth radius in km
      
      coordFilter['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians]
        }
      };
      
      // Also add a fallback condition for equipment without coordinates but matching location text
      if (location) {
        coordFilter.$or = coordFilter.$or || [];
        coordFilter.$or.push(
          { 'location.address': { $regex: location, $options: 'i' } },
          { 'location.district': { $regex: location, $options: 'i' } },
          { 'location.city': { $regex: location, $options: 'i' } }
        );
      }
      
      Object.assign(filter, coordFilter);
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
    
    console.log('Final search filter:', JSON.stringify(filter, null, 2));
    console.log('Sort object:', sortObj);
    
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

    console.log(`Found ${equipment.length} equipment items out of ${total} total`);

    // Transform data for frontend
    const transformedEquipment = (equipment as unknown as LeanEquipment[]).map((item) => ({
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