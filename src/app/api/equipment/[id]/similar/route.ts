import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();

    const equipmentId = params.id;

    // Get the original equipment to find similar ones
    const equipment = await EquipmentModel.findById(equipmentId);

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Find similar equipment based on:
    // 1. Same category
    // 2. Nearby location (within ~20km)
    // 3. Exclude current equipment
    const similarEquipment = await EquipmentModel.find({
      _id: { $ne: equipmentId },
      category: equipment.category,
      status: 'available',
      ...(equipment.location?.coordinates && {
        'location.coordinates': {
          $geoWithin: {
            $centerSphere: [
              equipment.location.coordinates,
              20 / 6378.1 // 20km radius
            ]
          }
        }
      })
    })
      .limit(6)
      .select('title images pricePerDay rating reviewCount location')
      .lean();

    // Transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedEquipment = similarEquipment.map((item: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (item._id as any).toString(),
      title: item.title as string,
      image: (item.images as string[])?.[0] || '',
      pricePerDay: item.pricePerDay as number,
      rating: (item.rating as number) || 4.5,
      reviewCount: (item.reviewCount as number) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      location: (item.location as any)?.address || 'Chưa cập nhật'
    }));

    return NextResponse.json({
      success: true,
      data: transformedEquipment
    });

  } catch (error) {
    console.error('Error fetching similar equipment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch similar equipment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
