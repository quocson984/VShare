import { NextRequest, NextResponse } from 'next/server';

// Vietnam bounds for location validation
const VIETNAM_BOUNDS = {
  north: 23.393395,
  south: 8.560,
  east: 109.464,
  west: 102.144
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!query && (!lat || !lon)) {
      return NextResponse.json(
        { success: false, error: 'Either query or lat/lon coordinates required' },
        { status: 400 }
      );
    }

    let url: string;
    
    if (query) {
      // Forward geocoding - search for locations
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=10&addressdetails=1`;
    } else {
      // Reverse geocoding - get address from coordinates
      url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VShare-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (query) {
      // Process search results
      const locations = Array.isArray(data) ? data : [data];
      const filteredLocations = locations
        .filter((location) => {
          const lat = parseFloat(location.lat);
          const lon = parseFloat(location.lon);
          
          // Filter to Vietnam only
          return lat >= VIETNAM_BOUNDS.south && 
                 lat <= VIETNAM_BOUNDS.north &&
                 lon >= VIETNAM_BOUNDS.west && 
                 lon <= VIETNAM_BOUNDS.east;
        })
        .map((location) => ({
          id: location.place_id,
          name: location.display_name,
          address: formatVietnameseAddress(location.address),
          coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
          type: location.type,
          importance: location.importance
        }))
        .sort((a, b) => (b.importance || 0) - (a.importance || 0));

      return NextResponse.json({
        success: true,
        data: filteredLocations.slice(0, 10) // Limit to top 10 results
      });
    } else {
      // Process reverse geocoding result
      if (!data || data.error) {
        return NextResponse.json(
          { success: false, error: 'Location not found' },
          { status: 404 }
        );
      }

      const location = {
        id: data.place_id,
        name: data.display_name,
        address: formatVietnameseAddress(data.address),
        coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
        type: data.type
      };

      return NextResponse.json({
        success: true,
        data: location
      });
    }

  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process location request' 
      },
      { status: 500 }
    );
  }
}

function formatVietnameseAddress(address: Record<string, string>): string {
  if (!address) return '';
  
  const parts = [];
  
  // Add house number and street
  if (address.house_number) parts.push(address.house_number);
  if (address.road) parts.push(address.road);
  
  // Add ward/commune
  if (address.suburb) parts.push(address.suburb);
  else if (address.village) parts.push(address.village);
  else if (address.hamlet) parts.push(address.hamlet);
  
  // Add district
  if (address.city_district) parts.push(address.city_district);
  else if (address.county) parts.push(address.county);
  
  // Add city/province
  if (address.city) parts.push(address.city);
  else if (address.state) parts.push(address.state);
  
  return parts.join(', ');
}