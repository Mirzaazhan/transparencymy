import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, Eye, MessageSquare } from 'lucide-react';
import { mockTransactions } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';
import ProjectDetails from './ProjectDetails';
import FeedbackModal from './FeedbackModal';

const Projects: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [feedbackProject, setFeedbackProject] = useState<string | null>(null);

  const departments = Array.from(new Set(mockTransactions.map(t => t.department)));

  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || transaction.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

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

  if (selectedProject) {
    const project = mockTransactions.find(t => t.id === selectedProject);
    if (project) {
      return <ProjectDetails project={project} onBack={() => setSelectedProject(null)} />;
    }
  }

  return (
    <div className="bg-gray-50 p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('projects.title')}</h1>
        <p className="text-gray-600">Track government projects and their spending in real-time</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('projects.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full md:w-auto pl-10 pr-8 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
            >
              <option value="">{t('projects.all')}</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                    {transaction.projectName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {transaction.description}
                  </p>
                </div>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                  {t(`status.${transaction.status.toLowerCase().replace(' ', '_')}`)}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {transaction.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  {new Date(transaction.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  {transaction.department}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('project.budgetAllocated')}:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(transaction.budgetAllocated)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('project.amountSpent')}:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(transaction.amountSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('project.remaining')}:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(transaction.remaining)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{((transaction.amountSpent / transaction.budgetAllocated) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(transaction.amountSpent / transaction.budgetAllocated) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedProject(transaction.id)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('project.viewDetails')}
                </button>
                <button
                  onClick={() => setFeedbackProject(transaction.id)}
                  className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackProject && (
        <FeedbackModal
          projectId={feedbackProject}
          onClose={() => setFeedbackProject(null)}
        />
      )}
    </div>
  );
};

export default Projects;
