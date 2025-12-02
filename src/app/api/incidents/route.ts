import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { IncidentModel } from '@/models/incident';
import { BookingModel } from '@/models/booking';
import { EquipmentModel } from '@/models/equipment';

// GET - Fetch incidents for a user
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // Fetch incidents reported by this user
    const incidents = await IncidentModel.find({ reporterId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with booking and equipment details
    const enrichedIncidents = await Promise.all(
      incidents.map(async (incident: any) => {
        let equipmentTitle = null;
        
        if (incident.bookingId) {
          const booking = await BookingModel.findById(incident.bookingId).lean();
          if (booking) {
            const equipment = await EquipmentModel.findById((booking as any).equipmentId).lean();
            equipmentTitle = (equipment as any)?.title;
          }
        }

        return {
          id: incident._id.toString(),
          bookingId: incident.bookingId?.toString(),
          equipmentTitle,
          description: incident.description,
          type: incident.type,
          severity: incident.severity,
          status: incident.status,
          images: incident.images || [],
          notes: incident.notes,
          createdAt: incident.createdAt,
          updatedAt: incident.updatedAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedIncidents
    });

  } catch (error) {
    console.error('Incidents fetch error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch incidents'
    }, { status: 500 });
  }
}

// POST - Create new incident
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { reporterId, bookingId, type, severity, description, images } = body;

    if (!reporterId || !type || !description) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // For incidents related to bookings, bookingId and severity are required
    if (type !== 'question' && (!bookingId || !severity)) {
      return NextResponse.json({
        success: false,
        message: 'Booking ID and severity are required for incident reports'
      }, { status: 400 });
    }

    // Create incident data
    const incidentData: any = {
      reporterId,
      type,
      description,
      images: images || [],
      status: 'pending'
    };

    // Add booking-related fields only if provided
    if (bookingId && type !== 'question') {
      incidentData.bookingId = bookingId;
      incidentData.severity = severity;
    }

    const incident = await IncidentModel.create(incidentData);

    return NextResponse.json({
      success: true,
      message: 'Incident reported successfully',
      data: {
        id: incident._id.toString(),
        ...incidentData
      }
    });

  } catch (error) {
    console.error('Incident creation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create incident',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
