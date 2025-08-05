import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { mockTransactions, mockDepartments } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowUpIcon, ArrowDownIcon, InfoIcon } from '@govtechmy/myds-react/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@govtechmy/myds-react/table';
import { Tag } from '@govtechmy/myds-react/tag';

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
    <div className="bg-gray-50 p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('nav.analytics')}</h1>
        <p className="text-gray-600">Advanced analytics and insights into government spending patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Spending (6M)</p>
              <p className="text-3xl font-bold text-gray-800">{formatCurrency(totalSpending)}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-full">
              <InfoIcon className="h-7 w-7 text-blue-500" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Average: {formatCurrency(avgMonthlySpending)}/month</p>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
              <p className="text-3xl font-bold text-gray-800">{monthlyGrowth.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-green-100 rounded-full">
              <ArrowUpIcon className="h-7 w-7 text-green-500" />
            </div>
          </div>
          <p className="mt-4 text-sm text-green-500 font-medium">vs Previous Month</p>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-3xl font-bold text-gray-800">{mockTransactions.filter(t => t.status === 'In Progress').length}</p>
            </div>
            <div className="p-4 bg-yellow-100 rounded-full">
              <InfoIcon className="h-7 w-7 text-yellow-500" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Across {mockDepartments.length} Departments</p>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Project Value</p>
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(mockTransactions.reduce((sum, t) => sum + t.amount, 0) / mockTransactions.length)}
              </p>
            </div>
            <div className="p-4 bg-purple-100 rounded-full">
              <ArrowDownIcon className="h-7 w-7 text-purple-500" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Per Project</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-card p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlySpending}>
              <defs>
                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fill: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }} formatter={(value) => formatCurrency(value as number)} />
              <Area type="monotone" dataKey="spending" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpending)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-card p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Department Budget Efficiency</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentEfficiency} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6b7280' }} />
              <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
              <Bar dataKey="efficiency" fill="#10b981" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Spending by Location</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={locationSpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="location" tick={{ fill: '#6b7280' }} />
              <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fill: '#6b7280' }} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="amount" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg shadow-card p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Project Analytics</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Budget Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ROI Score</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => {
                const utilization = (transaction.amountSpent / transaction.budgetAllocated) * 100;
                const roiScore = Math.floor(Math.random() * 40) + 60;
                const riskLevel = utilization > 90 ? 'High' : utilization > 70 ? 'Medium' : 'Low';
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-800">{transaction.projectName}</div>
                      <div className="text-sm text-gray-500">{transaction.location}</div>
                    </TableCell>
                    <TableCell>{transaction.department.replace('Ministry of ', '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-3">
                          <div className={`h-2.5 rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${utilization}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{utilization.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tag
                        variant={
                          transaction.status === 'Completed' ? 'success' :
                          transaction.status === 'In Progress' ? 'warning' :
                          transaction.status === 'Planned' ? 'primary' :
                          'danger'
                        }
                      >
                        {transaction.status}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-gray-800">{roiScore}/100</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tag
                        variant={
                          riskLevel === 'High' ? 'danger' :
                          riskLevel === 'Medium' ? 'warning' :
                          'success'
                        }
                      >
                        {riskLevel}
                      </Tag>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
