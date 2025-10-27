'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OwnerDashboard from '@/components/OwnerDashboard';

export default function OwnerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and has owner role
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.role === 'owner') {
          setUser(userData);
        } else {
          // Redirect non-owners to home page
          router.push('/');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Owner Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.name}! Manage your rental equipment.
            </p>
          </div>
          
          <OwnerDashboard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
