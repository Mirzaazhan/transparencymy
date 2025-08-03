import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { mockTransactions, mockDepartments } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';

const Analytics: React.FC = () => {
  const { t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Monthly spending trend
  const monthlySpending = [
    { month: 'Jan', spending: 45000000, projects: 12 },
    { month: 'Feb', spending: 52000000, projects: 15 },
    { month: 'Mar', spending: 48000000, projects: 18 },
    { month: 'Apr', spending: 61000000, projects: 14 },
    { month: 'May', spending: 55000000, projects: 16 },
    { month: 'Jun', spending: 67000000, projects: 20 }
  ];

  // Project status distribution
  const statusData = [
    { name: 'Completed', value: mockTransactions.filter(t => t.status === 'Completed').length, color: '#10b981' },
    { name: 'In Progress', value: mockTransactions.filter(t => t.status === 'In Progress').length, color: '#f59e0b' },
    { name: 'Planned', value: mockTransactions.filter(t => t.status === 'Planned').length, color: '#3b82f6' },
    { name: 'Cancelled', value: mockTransactions.filter(t => t.status === 'Cancelled').length, color: '#ef4444' }
  ];

  // Department efficiency
  const departmentEfficiency = mockDepartments.map(dept => ({
    name: dept.name.replace('Ministry of ', ''),
    efficiency: (dept.totalSpent / dept.totalBudget) * 100,
    projects: dept.projectCount,
    budget: dept.totalBudget
  }));

  // Location-based spending
  const locationSpending = [
    { location: 'Kuala Lumpur', amount: 35000000, projects: 8 },
    { location: 'Selangor', amount: 28000000, projects: 6 },
    { location: 'Sabah', amount: 15000000, projects: 4 },
    { location: 'Johor', amount: 12000000, projects: 3 },
    { location: 'Penang', amount: 18000000, projects: 5 }
  ];

  const totalSpending = monthlySpending.reduce((sum, month) => sum + month.spending, 0);
  const avgMonthlySpending = totalSpending / monthlySpending.length;
  const currentMonth = monthlySpending[monthlySpending.length - 1];
  const previousMonth = monthlySpending[monthlySpending.length - 2];
  const monthlyGrowth = ((currentMonth.spending - previousMonth.spending) / previousMonth.spending) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('nav.analytics')}</h1>
        <p className="text-gray-600">Advanced analytics and insights into government spending patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spending (6M)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpending)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-blue-600 font-medium">Average: {formatCurrency(avgMonthlySpending)}/month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
              <p className="text-2xl font-bold text-gray-900">{monthlyGrowth.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-600 font-medium">vs Previous Month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{mockTransactions.filter(t => t.status === 'In Progress').length}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <PieChart className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-yellow-600 font-medium">Across {mockDepartments.length} Departments</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Project Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockTransactions.reduce((sum, t) => sum + t.amount, 0) / mockTransactions.length)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <TrendingDown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-purple-600 font-medium">Per Project</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlySpending}>
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Area 
                type="monotone" 
                dataKey="spending" 
                stroke="#2563eb" 
                fillOpacity={1} 
                fill="url(#colorSpending)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Efficiency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Budget Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentEfficiency} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="efficiency" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location-based Spending */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationSpending}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="amount" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Project Analytics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTransactions.map((transaction) => {
                const utilization = (transaction.amountSpent / transaction.budgetAllocated) * 100;
                const roiScore = Math.floor(Math.random() * 40) + 60; // Mock ROI score
                const riskLevel = utilization > 90 ? 'High' : utilization > 70 ? 'Medium' : 'Low';
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.projectName}</div>
                      <div className="text-sm text-gray-500">{transaction.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.department.replace('Ministry of ', '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilization > 90 ? 'bg-red-500' :
                              utilization > 75 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{utilization.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'Planned' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{roiScore}/100</span>
                        <div className="ml-2 w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${roiScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                        riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
