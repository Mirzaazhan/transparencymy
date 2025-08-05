import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockDepartments, mockTransactions } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';
import { InfoIcon } from '@govtechmy/myds-react/icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@govtechmy/myds-react/table';
import { Tag } from '@govtechmy/myds-react/tag';

const Departments: React.FC = () => {
  const { t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const departmentData = mockDepartments.map(dept => ({
    name: dept.name.replace('Ministry of ', ''),
    budget: dept.totalBudget,
    spent: dept.totalSpent,
    efficiency: ((dept.totalSpent / dept.totalBudget) * 100).toFixed(1)
  }));

  return (
    <div className="bg-gray-50 p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('nav.departments')}</h1>
        <p className="text-gray-600">Overview of government departments and their spending efficiency</p>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {mockDepartments.map((department) => {
          const utilization = (department.totalSpent / department.totalBudget) * 100;
          const departmentProjects = mockTransactions.filter(t => t.department === department.name);
          const activeProjects = departmentProjects.filter(t => t.status === 'In Progress').length;
          
          return (
            <div key={department.id} className="bg-white rounded-lg shadow-card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <InfoIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{department.name}</h3>
                  <p className="text-sm text-gray-500">{department.projectCount} projects</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-lg font-semibold text-gray-800">{formatCurrency(department.totalBudget)}</p>
                  </div>
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-500">Amount Spent</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(department.totalSpent)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                    <span className="text-sm font-bold text-gray-800">{utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm font-medium text-gray-600">Active Projects</span>
                  <span className="text-lg font-bold text-gray-800">{activeProjects}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Comparison Chart */}
      <div className="bg-white rounded-lg shadow-card p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Department Budget vs Spending Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
            <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{ fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}
              formatter={(value, name) => [formatCurrency(value as number), name === 'budget' ? 'Budget' : 'Spent']}
            />
            <Bar dataKey="budget" fill="#d1d5db" name="Budget" />
            <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-lg shadow-card p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Department Performance Overview</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Total Budget</TableHead>
                <TableHead>Amount Spent</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDepartments.map((department) => {
                const utilization = (department.totalSpent / department.totalBudget) * 100;
                return (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full mr-4">
                          <InfoIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{department.name}</div>
                          <div className="text-sm text-gray-500">Government Ministry</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(department.totalBudget)}</TableCell>
                    <TableCell>{formatCurrency(department.totalSpent)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2.5 mr-3">
                          <div className={`h-2.5 rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${utilization}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{utilization.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{department.projectCount}</TableCell>
                    <TableCell>
                      <Tag
                        variant={
                          utilization > 90 ? 'danger' :
                          utilization > 75 ? 'warning' :
                          'success'
                        }
                      >
                        {utilization > 90 ? 'High Usage' : utilization > 75 ? 'Moderate Usage' : 'Efficient'}
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

export default Departments;
