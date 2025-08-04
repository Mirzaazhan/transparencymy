import React from 'react';
import { ArrowLeft, MapPin, Calendar, DollarSign, Hash, ExternalLink, CheckCircle, Check } from 'lucide-react';
import { Transaction } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface ProjectDetailsProps {
  project: Transaction;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
  const { t } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = (project.amountSpent / project.budgetAllocated) * 100;

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Project Details</h1>
          <p className="text-gray-600">Detailed information and blockchain verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Project Info */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{project.projectName}</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-8">{project.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 mr-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold text-gray-700">{project.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-6 w-6 mr-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-700">{new Date(project.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start">
                <DollarSign className="h-6 w-6 mr-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-semibold text-gray-700">{project.department}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Hash className="h-6 w-6 mr-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Project ID</p>
                  <p className="font-semibold text-gray-700">{project.id}</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Project Progress</h3>
                <span className="text-lg font-bold text-blue-600">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Blockchain Verification */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Blockchain Verification</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Transaction Hash:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-white px-3 py-1 rounded-md border border-gray-300 font-mono text-gray-700">
                      {project.blockchainHash}
                    </code>
                    <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Network:</span>
                  <span className="text-sm font-semibold text-gray-800">Polygon Mainnet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className="text-sm font-semibold text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Project Timeline</h3>
            <div className="relative">
              <div className="absolute left-2.5 top-0 h-full w-0.5 bg-gray-200"></div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-5 h-5 bg-green-500 rounded-full z-10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Project Approved</p>
                    <p className="text-sm text-gray-600">Budget allocated and project approved by ministry</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(project.date).toLocaleDateString()}</p>
                  </div>
                </div>
                {project.status !== 'Planned' && (
                  <div className="flex items-start space-x-4">
                    <div className="w-5 h-5 bg-blue-500 rounded-full z-10"></div>
                    <div>
                      <p className="font-semibold text-gray-800">Implementation Started</p>
                      <p className="text-sm text-gray-600">Project implementation phase began</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(new Date(project.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {project.status === 'Completed' && (
                  <div className="flex items-start space-x-4">
                    <div className="w-5 h-5 bg-green-500 rounded-full z-10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Project Completed</p>
                      <p className="text-sm text-gray-600">All project objectives achieved</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(new Date(project.date).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Budget Allocated</span>
                <span className="font-semibold text-gray-800">{formatCurrency(project.budgetAllocated)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Amount Spent</span>
                <span className="font-semibold text-blue-600">{formatCurrency(project.amountSpent)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Remaining</span>
                <span className="font-semibold text-green-600">{formatCurrency(project.remaining)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600">Utilization Rate</span>
                <span className="font-semibold text-gray-800">{progressPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                View on Blockchain
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                Download Report
              </button>
              <button className="w-full px-4 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                Share Project
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Project Manager</p>
                <p className="font-semibold text-gray-800">Dato' Ahmad Rahman</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-800">{project.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a href={`mailto:info@${project.department.toLowerCase().replace(/\s+/g, '')}.gov.my`} className="font-semibold text-blue-600 hover:underline">
                  info@{project.department.toLowerCase().replace(/\s+/g, '')}.gov.my
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
