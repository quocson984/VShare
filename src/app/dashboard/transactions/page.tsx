'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import DateRangePicker from '@/components/DateRangePicker';
import { ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'payment' | 'payout';
  bookingId: string;
  equipmentTitle: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method?: string;
  createdAt: string;
  counterpartyName?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'payment' | 'payout'>('all');
  
  // Get first and last day of current month
  const getDefaultDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: firstDay, to: lastDay };
  };
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(getDefaultDateRange);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(savedUser);
    setUser(userData);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let filtered = [...transactions];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Date range filter
    if (dateRange.from) {
      const startDateTime = new Date(dateRange.from);
      startDateTime.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.createdAt) >= startDateTime);
    }

    if (dateRange.to) {
      const endDateTime = new Date(dateRange.to);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.createdAt) <= endDateTime);
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, dateRange]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions?userId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[status] || badges.pending;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>{badge.label}</span>;
  };

  const getMethodLabel = (method?: string) => {
    if (!method) return 'N/A';
    return method === 'banking' ? 'Chuyển khoản' : 'Ví điện tử';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} ${timeStr}`;
  };

  const calculateSummary = () => {
    const summary = {
      totalPayments: 0,
      totalPayouts: 0
    };

    filteredTransactions.forEach(t => {
      if (t.type === 'payment') {
        summary.totalPayments += t.amount;
      } else {
        summary.totalPayouts += t.amount;
      }
    });

    return summary;
  };

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

  const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Giao dịch</h1>
          <p className="text-gray-600 mt-1">Quản lý các giao dịch thanh toán và nhận tiền</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng chi</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatPrice(summary.totalPayments)}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng thu</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatPrice(summary.totalPayouts)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Range Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại giao dịch
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'payment' | 'payout')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="payment">Chi tiền</option>
                <option value="payout">Thu tiền</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {transactions.length === 0 
                    ? 'Chưa có giao dịch nào' 
                    : 'Không tìm thấy giao dịch phù hợp'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.type === 'payment' ? (
                            <div className="flex items-center text-red-600">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Chi</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <ArrowDownLeft className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Thu</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaction.type === 'payment' 
                            ? `Thanh toán thuê ${transaction.equipmentTitle}` 
                            : `Nhận tiền cho ${transaction.equipmentTitle}`}
                        </div>
                        {transaction.counterpartyName && (
                          <div className="text-xs text-gray-500 mt-1">
                            {transaction.type === 'payment' ? 'Cho chủ thiết bị' : 'Từ người thuê'}: {transaction.counterpartyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'payment' ? '-' : '+'}{formatPrice(transaction.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
