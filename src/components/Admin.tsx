import React, { useState } from 'react';
import { Plus, Upload, Download, Settings, Users, Shield, Database } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

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
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'transactions', label: 'Add Transaction', icon: Plus },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'blockchain', label: 'Blockchain Settings', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database }
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {adminSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="font-semibold">{section.label}</span>
                  </button>
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
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                      <p className="text-3xl font-bold text-gray-800">156</p>
                    </div>
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Database className="h-7 w-7 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Users</p>
                      <p className="text-3xl font-bold text-gray-800">24</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-full">
                      <Users className="h-7 w-7 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Blockchain Status</p>
                      <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-full">
                      <Shield className="h-7 w-7 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Upload className="h-5 w-5 mr-3" />
                    Bulk Import Transactions
                  </button>
                  <button className="flex items-center justify-center px-6 py-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <Download className="h-5 w-5 mr-3" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'transactions' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Transaction</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={newTransaction.department}
                      onChange={(e) => setNewTransaction({...newTransaction, department: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Ministry of Health">Ministry of Health</option>
                      <option value="Ministry of Education">Ministry of Education</option>
                      <option value="Ministry of Transport">Ministry of Transport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newTransaction.projectName}
                      onChange={(e) => setNewTransaction({...newTransaction, projectName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Allocated (MYR)
                    </label>
                    <input
                      type="number"
                      value={newTransaction.budgetAllocated}
                      onChange={(e) => setNewTransaction({...newTransaction, budgetAllocated: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Spent (MYR)
                    </label>
                    <input
                      type="number"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newTransaction.location}
                      onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Transaction to Blockchain
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">User Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-semibold text-gray-800">Admin User</p>
                    <p className="text-sm text-gray-600">admin@transparensimyapp.gov.my</p>
                  </div>
                  <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-semibold text-gray-800">Department Manager</p>
                    <p className="text-sm text-gray-600">manager@health.gov.my</p>
                  </div>
                  <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'blockchain' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Blockchain Configuration</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Network
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Polygon Mainnet</option>
                      <option>Polygon Mumbai (Testnet)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Address
                    </label>
                    <input
                      type="text"
                      value="0x742d35Cc6634C0532925a3b8D4C9db7C4c4c4c4c"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100"
                      readOnly
                    />
                  </div>
                </div>
                <div className="p-4 bg-green-100 rounded-md">
                  <div className="flex items-center">
                    <Shield className="h-6 w-6 text-green-600 mr-3" />
                    <span className="font-semibold text-green-800">
                      Blockchain connection is active and secure
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Data Management</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Upload className="h-5 w-5 mr-3" />
                    Import CSV Data
                  </button>
                  <button className="flex items-center justify-center px-6 py-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <Download className="h-5 w-5 mr-3" />
                    Export All Data
                  </button>
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
