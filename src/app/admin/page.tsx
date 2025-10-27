'use client';

import { useState } from 'react';
import { Database, MapPin, Camera, Search, Users, Settings, Package } from 'lucide-react';
import AdminVerificationDashboard from '@/components/AdminVerificationDashboard';
import AdminEquipmentDashboard from '@/components/AdminEquipmentDashboard';

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [equipmentCount, setEquipmentCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'database' | 'verification' | 'equipment'>('database');

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    try {
      const response = await fetch('/api/seed-equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSeedResult(data);

      if (data.success) {
        setEquipmentCount(data.data.count);
      }
    } catch (error) {
      setSeedResult({
        success: false,
        error: 'Failed to seed data: ' + error
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCheckData = async () => {
    try {
      const response = await fetch('/api/seed-equipment');
      const data = await response.json();

      if (data.success) {
        setEquipmentCount(data.data.totalCount);
        setSeedResult({
          success: true,
          message: `Found ${data.data.totalCount} equipment items in database`,
          data: data.data
        });
      }
    } catch (error) {
      setSeedResult({
        success: false,
        error: 'Failed to check data: ' + error
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Settings className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage database and user verifications
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('database')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'database'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Database className="h-5 w-5 inline mr-2" />
                Database Management
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'verification'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Users className="h-5 w-5 inline mr-2" />
                User Verification
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'equipment'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Package className="h-5 w-5 inline mr-2" />
                Equipment Approval
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'database' && (
              <div>
                <div className="text-center mb-8">
                  <Database className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Database Management
                  </h2>
                  <p className="text-gray-600">
                    Quản lý dữ liệu thiết bị cho demo VShare
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-orange-500" />
                      Sample Equipment Data
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Seed database với 5 thiết bị mẫu có tọa độ GPS thực tế ở TP.HCM:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>• Canon EOS R5 (Quận 7)</li>
                      <li>• Sony FX6 (Quận 3)</li>
                      <li>• DJI Ronin RS3 (Quận 7)</li>
                      <li>• Nikon Z6 II (Quận 1)</li>
                      <li>• Aputure Lighting (Tân Phú)</li>
                    </ul>
                    <button
                      onClick={handleSeedData}
                      disabled={isSeeding}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
                    >
                      {isSeeding ? 'Đang seed data...' : 'Seed Sample Data'}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Search className="h-5 w-5 mr-2 text-orange-500" />
                      Check Current Data
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Kiểm tra số lượng thiết bị hiện có trong database:
                    </p>
                    {equipmentCount !== null && (
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <span className="text-2xl font-bold text-orange-600">
                          {equipmentCount}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">thiết bị</span>
                      </div>
                    )}
                    <button
                      onClick={handleCheckData}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Check Database
                    </button>
                  </div>
                </div>

                {/* Results */}
                {seedResult && (
                  <div className={`rounded-lg p-4 ${seedResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className="flex items-center mb-2">
                      <div className={`h-4 w-4 rounded-full mr-2 ${seedResult.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      <span className={`font-medium ${seedResult.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                        {seedResult.success ? 'Success' : 'Error'}
                      </span>
                    </div>
                    <p className={`text-sm ${seedResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                      {seedResult.message || seedResult.error}
                    </p>

                    {seedResult.success && seedResult.data?.equipment && (
                      <div className="mt-4">
                        <h4 className="font-medium text-green-900 mb-2">Equipment Added:</h4>
                        <div className="space-y-2">
                          {seedResult.data.equipment.map((item: any) => (
                            <div key={item.id} className="bg-white rounded p-2 text-sm">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-gray-600 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {item.location}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    🎯 Next Steps for Testing
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Seed sample data bằng button trên</li>
                    <li>Vào trang chủ và thử search: "Canon" hoặc "Quận 7"</li>
                    <li>Xem kết quả hiển thị trên map với markers</li>
                    <li>Click vào markers để xem thông tin thiết bị</li>
                    <li>Test responsive trên mobile</li>
                  </ol>
                  <div className="mt-4">
                    <a
                      href="/"
                      className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Test Search Now
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <AdminVerificationDashboard />
            )}

            {activeTab === 'equipment' && (
              <AdminEquipmentDashboard />
            )}
          </div>
        </div>
      </div>
    </div >
  );
}