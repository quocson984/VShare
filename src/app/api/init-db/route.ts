import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';
import { updateBookingStatuses } from '@/lib/updateBookingStatuses';
import { expireOldPayments } from '@/lib/expireOldPayments';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    // Create geospatial index for location coordinates
    await EquipmentModel.collection.createIndex(
      { "location.coordinates": "2dsphere" },
      { background: true }
    );

    // Also create text index for search
    await EquipmentModel.collection.createIndex(
      {
        "title": "text",
        "brand": "text", 
        "model": "text",
        "description": "text",
        "location.address": "text",
        "location.district": "text",
        "location.city": "text"
      },
      { background: true }
    );

    console.log('Database indexes created successfully');

    // Update booking statuses on app initialization
    await updateBookingStatuses();

    // Expire old payments (older than 5 minutes)
    await expireOldPayments();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });

  } catch (error) {
    console.error('Error creating indexes:', error);
    return NextResponse.json({
      success: false,
      message: 'Error creating database indexes',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}