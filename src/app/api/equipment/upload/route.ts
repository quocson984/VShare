import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { EquipmentModel } from '@/models/equipment';

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const formData = await request.formData();
    
    // Extract form data
    const title = formData.get('title') as string;
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const pricePerDay = parseFloat(formData.get('pricePerDay') as string);
    const pricePerWeek = parseFloat(formData.get('pricePerWeek') as string) || 0;
    const pricePerMonth = parseFloat(formData.get('pricePerMonth') as string) || 0;
    const replacementPrice = parseFloat(formData.get('replacementPrice') as string);
    const deposit = parseFloat(formData.get('deposit') as string) || 0;
    const ownerId = formData.get('ownerId') as string;
    
    // Location data
    const address = formData.get('address') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    
    // Serial numbers (JSON string)
    const serialNumbersData = formData.get('serialNumbers') as string;
    let serialNumbers: string[] = [];
    if (serialNumbersData) {
      try {
        serialNumbers = JSON.parse(serialNumbersData);
      } catch (e) {
        console.error('Error parsing serialNumbers:', e);
      }
    }
    
    // Specs data (JSON string)
    const specsData = formData.get('specs') as string;
    let specs = [];
    if (specsData) {
      try {
        specs = JSON.parse(specsData);
      } catch (e) {
        console.error('Error parsing specs:', e);
      }
    }
    
    // Images (JSON string of URLs from ImgBB)
    const imagesData = formData.get('images') as string;
    let images: string[] = [];
    if (imagesData) {
      try {
        images = JSON.parse(imagesData);
      } catch (e) {
        console.error('Error parsing images:', e);
      }
    }

    // Validate required fields
    if (!title || !category || !quantity || !pricePerDay || !replacementPrice || !ownerId) {
      return NextResponse.json({
        success: false,
        message: 'Title, category, quantity, price per day, replacement price, and owner ID are required'
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['camera', 'lens', 'lighting', 'audio', 'accessory'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid category'
      }, { status: 400 });
    }

    // Validate numeric values
    if (quantity < 1 || pricePerDay < 0 || replacementPrice < 0 || deposit < 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid numeric values'
      }, { status: 400 });
    }

    // Create equipment
    const equipment = new EquipmentModel({
      title: title.trim(),
      brand: brand?.trim() || '',
      model: model?.trim() || '',
      description: description?.trim() || '',
      images,
      serialNumbers,
      category,
      quantity,
      location: {
        type: 'Point',
        address: address?.trim() || '',
        coordinates: [longitude || 0, latitude || 0] // [longitude, latitude] format
      },
      specs,
      pricePerDay,
      pricePerWeek: pricePerWeek || undefined,
      pricePerMonth: pricePerMonth || undefined,
      replacementPrice,
      deposit,
      status: 'unavailable', // Start as unavailable until approved
      approvalStatus: 'pending',
      ownerId
    });

    const savedEquipment = await equipment.save();
    console.log('Equipment created successfully:', savedEquipment._id);

    return NextResponse.json({
      success: true,
      message: 'Equipment uploaded successfully and pending approval',
      equipment: {
        id: savedEquipment._id.toString(),
        title: savedEquipment.title,
        category: savedEquipment.category,
        approvalStatus: savedEquipment.approvalStatus,
        createdAt: savedEquipment.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Equipment upload API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error uploading equipment'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Equipment upload API is working',
    instructions: {
      method: 'POST',
      contentType: 'multipart/form-data',
      requiredFields: ['title', 'category', 'quantity', 'pricePerDay', 'replacementPrice', 'ownerId'],
      optionalFields: ['brand', 'model', 'description', 'pricePerWeek', 'pricePerMonth', 'deposit', 'address', 'latitude', 'longitude', 'specs'],
      imageUpload: {
        field: 'images',
        multiple: true,
        maxSize: '10MB per image',
        supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP']
      }
    }
  });
}
