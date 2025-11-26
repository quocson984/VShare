import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { InsuranceModel } from '@/models/insurance';

const fallbackInsurances = [
  {
    _id: 'fallback-basic',
    name: 'Bảo hiểm cơ bản',
    description: 'Bảo hiểm lên đến 5 triệu cho các hư hỏng nhẹ',
    minCoverage: 1000000,
    maxCoverage: 5000000,
    status: 'active'
  },
  {
    _id: 'fallback-standard',
    name: 'Bảo hiểm toàn diện',
    description: 'Bảo hiểm trọn gói, bao gồm cả mất cắp và va chạm',
    minCoverage: 8000000,
    maxCoverage: 20000000,
    status: 'active'
  }
];

export async function GET() {
  try {
    await connectMongoDB();
    const insurances = await InsuranceModel.find({ status: 'active' }).lean();

    return NextResponse.json({
      success: true,
      data: insurances.length ? insurances : fallbackInsurances
    });
  } catch (error) {
    console.error('Insurance fetch error:', error);
    return NextResponse.json({
      success: true,
      data: fallbackInsurances,
      message: 'Không thể kết nối dữ liệu bảo hiểm, sử dụng phương án dự phòng'
    }, { status: 200 });
  }
}

