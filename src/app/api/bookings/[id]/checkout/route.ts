import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { BookingModel } from '@/models/booking';
import { IncidentModel } from '@/models/incident';
import { EquipmentModel } from '@/models/equipment';

const appendNote = (current?: string, addition?: string) => {
  if (!addition) {
    return current;
  }
  if (!current) {
    return addition;
  }
  return `${current} | ${addition}`;
};

type Severity = 'none' | 'minor' | 'major' | 'critical';

const severityMultipliers: Record<Severity, number> = {
  none: 0,
  minor: 0.15,
  major: 0.4,
  critical: 1
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
      severity = 'none',
      issueDescription,
      lateMinutes: providedLateMinutes = 0,
      lateReason
    }: {
      images?: string[];
      notes?: string;
      severity?: Severity;
      issueDescription?: string;
      lateMinutes?: number;
      lateReason?: string;
    } = payload;

    const now = new Date();
    const endDate = booking.endDate ?? now;
    const calculatedLateMinutes = Math.max(
      0,
      Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60))
    );
    const lateMinutes = Math.max(calculatedLateMinutes, providedLateMinutes);

    const equipment = await EquipmentModel.findById(booking.equipmentId);
    const replacementPrice = equipment?.replacementPrice ?? (equipment?.pricePerDay ?? 0) * 10;
    const damageCharge = Math.round(
      replacementPrice * (severityMultipliers[severity] ?? 0) * Math.max(1, booking.quantity || 1)
    );

    const hourlyRate = (equipment?.pricePerDay ?? 0) / 24;
    const lateCharge = lateMinutes > 0
      ? Math.round(Math.ceil(lateMinutes / 60) * hourlyRate)
      : 0;

    const extraCharge = damageCharge + lateCharge;

    booking.checkoutImages = images.length ? images : booking.checkoutImages;
    booking.checkoutTime = now;
    booking.status = 'completed';
    booking.totalPrice = booking.totalPrice + extraCharge;
    if (notes) {
      booking.notes = appendNote(booking.notes, notes);
    }
    const summaryParts = ['Đã trả thiết bị', lateReason || undefined].filter(Boolean);
    if (summaryParts.length) {
      booking.notes = appendNote(booking.notes, summaryParts.join(' • '));
    }

    type IncidentPayload = {
      type: 'damage' | 'late' | 'other';
      severity: 'minor' | 'major' | 'critical';
      description: string;
      resolutionAmount?: number;
      notes?: string;
    };

    const incidentPayload: IncidentPayload[] = [];

    if (severity !== 'none') {
      incidentPayload.push({
        type: 'damage',
        severity,
        description: issueDescription || 'Ghi nhận hư hỏng khi trả thiết bị',
        resolutionAmount: damageCharge,
        notes: notes
      });
    }

    if (lateMinutes > 0) {
      incidentPayload.push({
        type: 'late',
        severity: 'minor',
        description: lateReason
          ? `Trễ hạn: ${lateReason}`
          : `Trả muộn ${Math.ceil(lateMinutes / 60)} giờ`,
        resolutionAmount: lateCharge
      });
    }

    let createdIncidents: any[] = [];
    if (incidentPayload.length) {
      createdIncidents = await Promise.all(
        incidentPayload.map((item) =>
          IncidentModel.create({
            bookingId: booking._id,
            reporterId: booking.renterId,
            description: item.description,
            type: item.type,
            severity: item.severity,
            notes: item.notes,
            resolutionAmount: item.resolutionAmount,
            status: 'pending'
          })
        )
      );
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      data: {
        booking,
        incidents: createdIncidents,
        extraCharges: {
          damage: damageCharge,
          late: lateCharge,
          total: extraCharge
        }
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json({
      success: false,
      message: 'Không thể cập nhật check-out',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

