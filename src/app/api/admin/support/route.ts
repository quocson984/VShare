import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { IncidentModel } from '@/models/incident';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const incidents = await IncidentModel.find()
      .populate('reporterId', 'fullname email phone avatar')
      .populate('bookingId', 'startDate endDate')
      .populate({
        path: 'bookingId',
        populate: {
          path: 'equipmentId',
          select: 'name images'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
