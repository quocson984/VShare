import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on status
    let query: any = {};
    
    if (status === 'pending') {
      query.approvalStatus = 'pending';
    } else if (status === 'approved') {
      query.approvalStatus = 'approved';
    } else if (status === 'rejected') {
      query.approvalStatus = 'rejected';
    }

    // Fetch equipment with pagination
    const skip = (page - 1) * limit;
    
    const equipment = await EquipmentModel.find(query)
      .populate('ownerId', 'email fullname phone')
      .select('title brand model category quantity pricePerDay pricePerWeek pricePerMonth replacementPrice deposit status approvalStatus approvalNotes images createdAt updatedAt ownerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await EquipmentModel.countDocuments(query);

    // Get status counts
    const statusCounts = await EquipmentModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const counts = statusCounts[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        equipment: equipment.map(item => ({
          id: (item as any)._id.toString(),
          title: item.title,
          brand: item.brand,
          model: item.model,
          category: item.category,
          quantity: item.quantity,
          pricePerDay: item.pricePerDay,
          pricePerWeek: item.pricePerWeek,
          pricePerMonth: item.pricePerMonth,
          replacementPrice: item.replacementPrice,
          deposit: item.deposit,
          status: item.status,
          approvalStatus: item.approvalStatus,
          approvalNotes: item.approvalNotes,
          images: item.images,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          owner: {
            id: item.ownerId._id.toString(),
            email: item.ownerId.email,
            fullname: item.ownerId.fullname,
            phone: item.ownerId.phone
          }
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        counts
      }
    });

  } catch (error: any) {
    console.error('Admin equipment API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching equipment data'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { equipmentId, action, notes } = body;

    if (!equipmentId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Equipment ID and action are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Action must be either approve or reject'
      }, { status: 400 });
    }

    // Find the equipment
    const equipment = await EquipmentModel.findById(equipmentId);
    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Equipment not found'
      }, { status: 404 });
    }

    // Update approval status
    const newApprovalStatus = action === 'approve' ? 'approved' : 'rejected';
    const newStatus = action === 'approve' ? 'available' : 'unavailable';

    equipment.approvalStatus = newApprovalStatus;
    equipment.status = newStatus;
    if (notes) {
      equipment.approvalNotes = notes;
    }

    await equipment.save();

    return NextResponse.json({
      success: true,
      message: `Equipment ${action}d successfully`,
      data: {
        equipmentId: equipment._id.toString(),
        approvalStatus: newApprovalStatus,
        status: newStatus,
        updatedAt: equipment.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Admin equipment action API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing equipment action'
    }, { status: 500 });
  }
}
