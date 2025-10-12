import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

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

    return NextResponse.json({
      success: true,
      message: 'Database indexes created successfully'
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