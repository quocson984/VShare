import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const equipment = await EquipmentModel.find()
      .populate('ownerId', 'fullname email phone avatar')
      .sort({ createdAt: -1 })
      .lean();

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
          total: equipment.length,
          page: 1,
          limit: equipment.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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
