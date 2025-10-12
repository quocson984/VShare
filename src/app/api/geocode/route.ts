import { NextRequest, NextResponse } from 'next/server';

interface GeoapifyResult {
  formatted: string;
  country_code?: string;
  country?: string;
  lat: number;
  lon: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  place_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Query too short'
      });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    
    console.log('Geocode API called with query:', query);
    console.log('API key available:', !!apiKey);
    
    if (!apiKey) {
      console.error('GEOAPIFY_API_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        message: 'API key not configured'
      }, { status: 500 });
    }

    // Enhance query for Vietnam-specific search
    let searchQuery = query;
    
    // Add Vietnam context if not present
    if (!query.toLowerCase().includes('vietnam') && 
        !query.toLowerCase().includes('việt nam') && 
        !query.toLowerCase().includes('vn')) {
      searchQuery = `${query}, Vietnam`;
    }

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&filter=countrycode:vn&bias=countrycode:vn&limit=8&format=json&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and enhance results for Vietnam
    let results: GeoapifyResult[] = data.results || [];
    
    // Filter only Vietnam results
    results = results.filter((result: GeoapifyResult) => 
      result.country_code === 'vn' || 
      result.country === 'Vietnam' || 
      result.country === 'Việt Nam'
    );
    
    // Sort results by relevance (prioritize exact matches)
    results.sort((a: GeoapifyResult, b: GeoapifyResult) => {
      const queryLower = query.toLowerCase();
      const aFormatted = a.formatted?.toLowerCase() || '';
      const bFormatted = b.formatted?.toLowerCase() || '';
      
      // Prioritize results that start with the query
      if (aFormatted.startsWith(queryLower) && !bFormatted.startsWith(queryLower)) {
        return -1;
      }
      if (!aFormatted.startsWith(queryLower) && bFormatted.startsWith(queryLower)) {
        return 1;
      }
      
      // Then prioritize results that contain the query
      const aContains = aFormatted.includes(queryLower);
      const bContains = bFormatted.includes(queryLower);
      
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      
      return 0;
    });
    
    // Add static Vietnam locations as fallback if results are limited
    if (results.length < 3) {
      const vietnamLocations = getVietnameseLocationSuggestions(query);
      results = [...results, ...vietnamLocations].slice(0, 8);
    }
    
    return NextResponse.json({
      success: true,
      data: results.slice(0, 8) // Limit to 8 results
    });

  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching location suggestions'
    }, { status: 500 });
  }
}

// Fallback Vietnamese location suggestions
function getVietnameseLocationSuggestions(query: string): GeoapifyResult[] {
  const locations = [
    { name: 'Quận 1, TP.HCM', lat: 10.7629, lon: 106.6820 },
    { name: 'Quận 2, TP.HCM', lat: 10.7473, lon: 106.7314 },
    { name: 'Quận 3, TP.HCM', lat: 10.7756, lon: 106.6840 },
    { name: 'Quận 4, TP.HCM', lat: 10.7594, lon: 106.7020 },
    { name: 'Quận 5, TP.HCM', lat: 10.7594, lon: 106.6672 },
    { name: 'Quận 6, TP.HCM', lat: 10.7475, lon: 106.6345 },
    { name: 'Quận 7, TP.HCM', lat: 10.7333, lon: 106.7190 },
    { name: 'Quận 8, TP.HCM', lat: 10.7385, lon: 106.6758 },
    { name: 'Quận 9, TP.HCM', lat: 10.7970, lon: 106.7619 },
    { name: 'Quận 10, TP.HCM', lat: 10.7675, lon: 106.6734 },
    { name: 'Quận 11, TP.HCM', lat: 10.7442, lon: 106.6431 },
    { name: 'Quận 12, TP.HCM', lat: 10.8058, lon: 106.6291 },
    { name: 'Quận Bình Thạnh, TP.HCM', lat: 10.8014, lon: 106.7109 },
    { name: 'Quận Gò Vấp, TP.HCM', lat: 10.8376, lon: 106.6717 },
    { name: 'Quận Phú Nhuận, TP.HCM', lat: 10.7980, lon: 106.6833 },
    { name: 'Quận Tân Bình, TP.HCM', lat: 10.8015, lon: 106.6518 },
    { name: 'Quận Tân Phú, TP.HCM', lat: 10.7943, lon: 106.6290 },
    { name: 'Quận Thủ Đức, TP.HCM', lat: 10.8505, lon: 106.7719 },
    { name: 'Ba Đình, Hà Nội', lat: 21.0353, lon: 105.8342 },
    { name: 'Hoàn Kiếm, Hà Nội', lat: 21.0285, lon: 105.8542 },
    { name: 'Hai Bà Trưng, Hà Nội', lat: 21.0067, lon: 105.8442 },
    { name: 'Đống Đa, Hà Nội', lat: 21.0182, lon: 105.8342 },
    { name: 'Tây Hồ, Hà Nội', lat: 21.0583, lon: 105.8214 },
    { name: 'Cầu Giấy, Hà Nội', lat: 21.0314, lon: 105.7968 },
    { name: 'Thanh Xuân, Hà Nội', lat: 20.9936, lon: 105.8044 },
    { name: 'Hoàng Mai, Hà Nội', lat: 20.9736, lon: 105.8581 },
    { name: 'Long Biên, Hà Nội', lat: 21.0545, lon: 105.8946 },
    { name: 'Hải Châu, Đà Nẵng', lat: 16.0544, lon: 108.2022 },
    { name: 'Thanh Khê, Đà Nẵng', lat: 16.0583, lon: 108.1716 },
    { name: 'Sơn Trà, Đà Nẵng', lat: 16.0861, lon: 108.2497 },
    { name: 'Ngũ Hành Sơn, Đà Nẵng', lat: 15.9989, lon: 108.2619 },
    { name: 'Liên Chiểu, Đà Nẵng', lat: 16.0755, lon: 108.1506 },
    { name: 'Cẩm Lệ, Đà Nẵng', lat: 16.0297, lon: 108.1856 }
  ];

  const queryLower = query.toLowerCase();
  return locations
    .filter(loc => loc.name.toLowerCase().includes(queryLower))
    .map(loc => ({
      formatted: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      country: 'Vietnam',
      country_code: 'vn',
      city: loc.name.includes('TP.HCM') ? 'TP.HCM' : loc.name.includes('Hà Nội') ? 'Hà Nội' : loc.name.includes('Đà Nẵng') ? 'Đà Nẵng' : 'Vietnam',
      address_line1: loc.name
    }))
    .slice(0, 5);
}