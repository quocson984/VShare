'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import EquipmentUploadForm from '@/components/EquipmentUploadForm';
import Header from '@/components/Header';

export default function NewEquipmentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back to equipment list after successful creation
    router.push('/dashboard/equipments');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with back button */}
          <div className="mb-6">
            <Link
              href="/dashboard/equipments"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Quay lại danh sách thiết bị
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Thêm thiết bị mới</h1>
            <p className="text-gray-600 mt-2">Điền thông tin để đăng thiết bị cho thuê</p>
          </div>

          {/* Equipment Upload Form */}
          <EquipmentUploadForm onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
