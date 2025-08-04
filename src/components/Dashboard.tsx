import React from 'react';
import { TrendingUp, TrendingDown, Activity, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockTransactions, mockDepartments } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();

  const totalBudget = mockDepartments.reduce((sum, dept) => sum + dept.totalBudget, 0);
  const totalSpent = mockDepartments.reduce((sum, dept) => sum + dept.totalSpent, 0);
  const activeProjects = mockTransactions.filter(t => t.status === 'In Progress').length;
  const completedProjects = mockTransactions.filter(t => t.status === 'Completed').length;

  const departmentData = mockDepartments.map(dept => ({
    name: dept.name.replace('Ministry of ', ''),
    spent: dept.totalSpent,
    budget: dept.totalBudget
  }));

  const spendingTrend = [
    { month: 'Jan', amount: 45000000 },
    { month: 'Feb', amount: 52000000 },
    { month: 'Mar', amount: 48000000 },
    { month: 'Apr', amount: 61000000 },
    { month: 'May', amount: 55000000 },
    { month: 'Jun', amount: 67000000 }
  ];

  const pieData = mockDepartments.map((dept, index) => ({
    name: dept.name.replace('Ministry of ', ''),
    value: dept.totalSpent,
    color: ['#dc2626', '#2563eb', '#eab308'][index]
  }));

  const COLORS = ['#dc2626', '#2563eb', '#eab308'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('dashboard.totalSpent')}</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-500 font-medium">+12.5%</span>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('dashboard.totalBudget')}</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500">Budget utilization:</span>
            <span className="text-sm text-blue-500 font-medium ml-2">
              {((totalSpent / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('dashboard.activeProjects')}</p>
              <p className="text-2xl font-bold text-gray-800">{activeProjects}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Activity className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-yellow-500 font-medium">In Progress</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('dashboard.completedProjects')}</p>
              <p className="text-2xl font-bold text-gray-800">{completedProjects}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-green-500 font-medium">Completed</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Spending */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Spending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Bar dataKey="spent" fill="#3b82f6" />
              <Bar dataKey="budget" fill="#d1d5db" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#ef4444', '#3b82f6', '#f59e0b'][index % 3]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
                formatter={(value) => formatCurrency(value as number)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Trend */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Spending Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={spendingTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
            <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTransactions.slice(0, 5).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{transaction.projectName}</div>
                    <div className="text-sm text-gray-500">{transaction.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {transaction.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                      transaction.status === 'Planned' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
