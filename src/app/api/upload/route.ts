import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'Không có file nào được upload'
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        message: 'File phải là hình ảnh'
      }, { status: 400 });
    }

    // Validate file size (max 32MB as per ImgBB limit)
    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'File quá lớn (tối đa 32MB)'
      }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Prepare ImgBB upload
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return NextResponse.json({
        success: false,
        message: 'ImgBB API key không được cấu hình'
      }, { status: 500 });
    }

    const imgbbFormData = new FormData();
    imgbbFormData.append('key', imgbbApiKey);
    imgbbFormData.append('image', base64Image);
    imgbbFormData.append('name', file.name);

    // Upload to ImgBB
    const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbFormData
    });

    const imgbbData = await imgbbResponse.json();

    if (!imgbbData.success) {
      return NextResponse.json({
        success: false,
        message: 'Lỗi upload hình ảnh: ' + (imgbbData.error?.message || 'Unknown error')
      }, { status: 500 });
    }

    // Return the image URL
    return NextResponse.json({
      success: true,
      data: {
        url: imgbbData.data.url,
        deleteUrl: imgbbData.data.delete_url,
        displayUrl: imgbbData.data.display_url,
        thumbUrl: imgbbData.data.thumb?.url,
        filename: imgbbData.data.title,
        size: imgbbData.data.size
      },
      message: 'Upload hình ảnh thành công'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi server khi upload hình ảnh'
    }, { status: 500 });
  }
}

// Optional: GET method to get upload instructions
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Image Upload API',
    instructions: {
      method: 'POST',
      contentType: 'multipart/form-data',
      field: 'image',
      maxSize: '32MB',
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'WebP']
    }
  });
}