'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import EquipmentUploadForm from '@/components/EquipmentUploadForm';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params?.id as string;
  
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    setUser(userData);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSuccess = () => {
    router.push('/dashboard/equipments');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/dashboard/equipments"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              ← Quay lại danh sách
            </Link>
          </div>
                  
          <EquipmentUploadForm 
            equipmentId={equipmentId}
            onSuccess={handleSuccess}
          />
        </div>
      </main>
    </div>
  );
}
