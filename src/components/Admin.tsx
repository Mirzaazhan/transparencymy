import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { PlusIcon, UploadIcon, DownloadIcon, SettingIcon, UserGroupIcon, InfoIcon, DatabaseIcon } from '@govtechmy/myds-react/icon';
import { Button } from '@govtechmy/myds-react/button';
import { Input } from '@govtechmy/myds-react/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@govtechmy/myds-react/select';
import { TextArea } from '@govtechmy/myds-react/textarea';
import { Tag } from '@govtechmy/myds-react/tag';

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');

  const [newTransaction, setNewTransaction] = useState({
    department: '',
    projectName: '',
    amount: '',
    description: '',
    location: '',
    budgetAllocated: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your blockchain/backend
    console.log('New transaction:', newTransaction);
    // Reset form
    setNewTransaction({
      department: '',
      projectName: '',
      amount: '',
      description: '',
      location: '',
      budgetAllocated: ''
    });
  };

  const adminSections = [
    { id: 'overview', label: 'Overview', icon: SettingIcon },
    { id: 'transactions', label: 'Add Budget', icon: PlusIcon },
    { id: 'users', label: 'User Management', icon: UserGroupIcon },
    { id: 'blockchain', label: 'Blockchain Settings', icon: InfoIcon },
    { id: 'data', label: 'Data Management', icon: DatabaseIcon }
  ];

  return (
    <div className="bg-gray-50 p-6 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('nav.admin')}</h1>
        <p className="text-gray-600">Administrative panel for managing government spending records</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Admin Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-card p-4">
            <nav className="space-y-2">
              {adminSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <Button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    variant={isActive ? 'primary-fill' : 'default-ghost'}
                    className="w-full justify-start"
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {section.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Admin Content */}
        <div className="lg:col-span-3">
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg shadow-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                      <p className="text-3xl font-bold text-gray-800">156</p>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-full">
                      <DatabaseIcon className="h-7 w-7 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Users</p>
                      <p className="text-3xl font-bold text-gray-800">24</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-full">
                      <UserGroupIcon className="h-7 w-7 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blockchain Status</p>
                      <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-full">
                      <InfoIcon className="h-7 w-7 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-card p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button variant="primary-fill">
                    <UploadIcon className="h-5 w-5 mr-3" />
                    Bulk Import Transactions
                  </Button>
                  <Button variant="primary-fill">
                    <DownloadIcon className="h-5 w-5 mr-3" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'transactions' && (
            <div className="bg-white rounded-lg shadow-card p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Budget</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <Select
                      value={newTransaction.department}
                      onValueChange={(value) => setNewTransaction({...newTransaction, department: value})}
                      variant="outline"
                      size="small"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ministry of Health">Ministry of Health</SelectItem>
                        <SelectItem value="Ministry of Education">Ministry of Education</SelectItem>
                        <SelectItem value="Ministry of Transport">Ministry of Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <Input
                      type="text"
                      value={newTransaction.projectName}
                      onChange={(e) => setNewTransaction({...newTransaction, projectName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Allocated (MYR)
                    </label>
                    <Input
                      type="number"
                      value={newTransaction.budgetAllocated}
                      onChange={(e) => setNewTransaction({...newTransaction, budgetAllocated: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Spent (MYR)
                    </label>
                    <Input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      type="text"
                      value={newTransaction.location}
                      onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <TextArea
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary-fill">
                    Add Transaction to Blockchain
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="bg-white rounded-lg shadow-card p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">User Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-semibold text-gray-800">Admin User</p>
                    <p className="text-sm text-gray-600">admin@transparensimyapp.gov.my</p>
                  </div>
                  <Tag variant="success">Active</Tag>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-semibold text-gray-800">Department Manager</p>
                    <p className="text-sm text-gray-600">manager@health.gov.my</p>
                  </div>
                  <Tag variant="success">Active</Tag>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'blockchain' && (
            <div className="bg-white rounded-lg shadow-card p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Blockchain Configuration</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <Select variant="outline" size="small">
                      <SelectTrigger>
                        <SelectValue placeholder="Polygon Mainnet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mainnet">Polygon Mainnet</SelectItem>
                        <SelectItem value="mumbai">Polygon Mumbai (Testnet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Address
                    </label>
                    <Input
                      type="text"
                      value="0x742d35Cc6634C0532925a3b8D4C9db7C4c4c4c4c"
                      readOnly
                    />
                  </div>
                </div>
                <div className="p-4 bg-green-100 rounded-md">
                  <div className="flex items-center">
                    <InfoIcon className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-semibold text-green-800">
                      Blockchain connection is active and secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="bg-white rounded-lg shadow-card p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Data Management</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button variant="primary-fill">
                    <UploadIcon className="h-5 w-5 mr-3" />
                    Import CSV Data
                  </Button>
                  <Button variant="primary-fill">
                    <DownloadIcon className="h-5 w-5 mr-3" />
                    Export All Data
                  </Button>
                </div>
                <div className="p-4 bg-yellow-100 rounded-md">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> All data operations are automatically recorded on the blockchain for transparency and immutability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
