import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { IncidentModel } from '@/models/incident';

const appendNote = (current?: string, addition?: string) => {
  if (!addition) {
    return current;
  }
  if (!current) {
    return addition;
  }
  return `${current} | ${addition}`;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongoDB();
    const booking = await BookingModel.findById(params.id);
    if (!booking) {
      return NextResponse.json({
        success: false,
        message: 'Đơn thuê không tồn tại'
      }, { status: 404 });
    }

    const payload = await request.json();
    const {
      images = [],
      notes,
      incident
    }: {
      images?: string[];
      notes?: string;
      incident?: {
        description?: string;
        severity?: 'minor' | 'major' | 'critical';
        type?: 'damage' | 'late' | 'other';
        estimatedCharge?: number;
      };
    } = payload;

    booking.checkinImages = images.length ? images : booking.checkinImages;
    booking.checkinTime = new Date();
    booking.status = 'reviewing';
    booking.notes = appendNote(booking.notes, notes);

    let createdIncident = null;
    if (incident?.description || incident?.severity) {
      createdIncident = await IncidentModel.create({
        bookingId: booking._id,
        reporterId: booking.renterId,
        description: incident.description ?? 'Đã ghi nhận sự vụ trong lúc nhận thiết bị',
        type: incident.type ?? 'damage',
        severity: incident.severity ?? 'minor',
        status: 'pending',
        resolutionAmount: incident.estimatedCharge
      });
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      data: {
        booking,
        incident: createdIncident
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({
      success: false,
      message: 'Không thể cập nhật check-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

