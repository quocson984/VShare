import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();
    
    if (!lat || !lng) {
      return NextResponse.json({
        success: false,
        message: 'Latitude and longitude required'
      });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    
    if (!apiKey) {
      console.error('GEOAPIFY_API_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        message: 'API key not configured'
      }, { status: 500 });
    }

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geoapify reverse geocode API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.results || []
    });

  } catch (error) {
    console.error('Reverse geocode API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching location information'
    }, { status: 500 });
  }
}