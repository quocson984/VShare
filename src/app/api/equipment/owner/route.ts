import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!ownerId) {
      return NextResponse.json({
        success: false,
        message: 'Owner ID is required'
      }, { status: 400 });
    }

    // Build query - owner sees all their equipment regardless of status
    // Convert ownerId to ObjectId for proper matching
    const mongoose = require('mongoose');
    let query: any = { ownerId: new mongoose.Types.ObjectId(ownerId) };
    
    if (status !== 'all') {
      if (status === 'pending') {
        query.approvalStatus = 'pending';
      } else if (status === 'approved') {
        query.approvalStatus = 'approved';
      } else if (status === 'rejected') {
        query.approvalStatus = 'rejected';
      } else if (status === 'available') {
        query.status = 'available';
        query.approvalStatus = 'approved';
      } else if (status === 'unavailable') {
        query.status = 'unavailable';
      } else if (status === 'rented') {
        query.status = 'rented';
      }
    }

    console.log('Owner equipment query:', JSON.stringify(query));

    // Fetch equipment with pagination
    const skip = (page - 1) * limit;
    
    const equipment = await EquipmentModel.find(query)
      .select('title brand model category quantity pricePerDay pricePerWeek pricePerMonth replacementPrice deposit status approvalStatus approvalNotes images createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await EquipmentModel.countDocuments(query);

    // Get status counts
    const statusCounts = await EquipmentModel.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'available'] }, { $eq: ['$approvalStatus', 'approved'] }] }, 1, 0] } },
          unavailable: { $sum: { $cond: [{ $eq: ['$status', 'unavailable'] }, 1, 0] } }
        }
      }
    ]);

    const counts = statusCounts[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      available: 0,
      unavailable: 0
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
          updatedAt: item.updatedAt
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
    console.error('Owner equipment API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching equipment data'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { equipmentId, ownerId, updates } = body;

    if (!equipmentId || !ownerId) {
      return NextResponse.json({
        success: false,
        message: 'Equipment ID and Owner ID are required'
      }, { status: 400 });
    }

    // Find equipment and verify ownership
    const equipment = await EquipmentModel.findOne({ 
      _id: equipmentId, 
      ownerId 
    });

    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Equipment not found or you do not have permission to edit it'
      }, { status: 404 });
    }

    // Only allow editing if not approved yet, or if approved, only allow status changes
    if (equipment.approvalStatus === 'approved') {
      // Only allow status updates for approved equipment
      const allowedUpdates = ['status'];
      const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
        if (allowedUpdates.includes(key)) {
          acc[key] = updates[key];
        }
        return acc;
      }, {} as any);

      if (Object.keys(filteredUpdates).length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Cannot edit approved equipment details. Only status can be changed.'
        }, { status: 400 });
      }

      Object.assign(equipment, filteredUpdates);
    } else {
      // For pending/rejected equipment, allow all updates
      Object.assign(equipment, updates);
    }

    await equipment.save();

    return NextResponse.json({
      success: true,
      message: 'Equipment updated successfully',
      equipment: {
        id: equipment._id.toString(),
        title: equipment.title,
        status: equipment.status,
        approvalStatus: equipment.approvalStatus
      }
    });

  } catch (error: any) {
    console.error('Equipment update API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error updating equipment'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const equipmentId = searchParams.get('equipmentId');
    const ownerId = searchParams.get('ownerId');

    if (!equipmentId || !ownerId) {
      return NextResponse.json({
        success: false,
        message: 'Equipment ID and Owner ID are required'
      }, { status: 400 });
    }

    // Find equipment and verify ownership
    const equipment = await EquipmentModel.findOne({ 
      _id: equipmentId, 
      ownerId 
    });

    if (!equipment) {
      return NextResponse.json({
        success: false,
        message: 'Equipment not found or you do not have permission to delete it'
      }, { status: 404 });
    }

    // Only allow deletion if not approved yet
    if (equipment.approvalStatus === 'approved') {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete approved equipment. Contact admin for assistance.'
      }, { status: 400 });
    }

    await EquipmentModel.findByIdAndDelete(equipmentId);

    return NextResponse.json({
      success: true,
      message: 'Equipment deleted successfully'
    });

  } catch (error: any) {
    console.error('Equipment delete API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error deleting equipment'
    }, { status: 500 });
  }
}
