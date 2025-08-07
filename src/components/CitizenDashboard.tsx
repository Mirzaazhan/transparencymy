import React, { useState, useEffect } from 'react';
import { suiContractsService, SpendingRecord, CitizenFeedback } from '../services/suiContracts';
import { LoginResult } from '../services/zklogin';
import { 
  Eye, 
  MessageSquare, 
  Star, 
  MapPin, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Users,
  Building,
  Send,
  Loader,
  CheckCircle,
  AlertCircle,
  PieChart,
  BarChart3
} from 'lucide-react';

interface CitizenDashboardProps {
  loginResult: LoginResult;
  onLogout: () => void;
}

const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ loginResult, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'feedback' | 'analytics' | 'history'>('projects');
  const [spendingRecords, setSpendingRecords] = useState<SpendingRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<SpendingRecord | null>(null);
  const [userFeedback, setUserFeedback] = useState<CitizenFeedback[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    message: '',
    rating: 5,
    isAnonymous: true
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading citizen dashboard data...');

      // Load spending records
      const records = await suiContractsService.getSpendingRecords();
      setSpendingRecords(records);

      // Load user's transaction history (for feedback tracking)
      const transactions = await suiContractsService.getUserTransactionHistory(loginResult.userAddress);
      const feedbackTransactions = transactions.filter(tx => tx.type === 'citizen_feedback');
      
      // Load analytics
      const analyticsData = await suiContractsService.getAnalytics();
      setAnalytics(analyticsData);

      console.log('✅ Citizen dashboard loaded:', {
        projects: records.length,
        userTransactions: transactions.length,
        totalSpending: analyticsData.totalSpending
      });

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setSubmissionStatus({
        type: 'error',
        message: 'Failed to load data. Please refresh and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedProject) return;

    setIsSubmittingFeedback(true);
    try {
      console.log('💬 Submitting citizen feedback...', {
        project: selectedProject.projectName,
        rating: feedbackForm.rating,
        anonymous: feedbackForm.isAnonymous
      });

      const feedback: CitizenFeedback = {
        projectId: selectedProject.id!,
        message: feedbackForm.message,
        rating: feedbackForm.rating,
        isAnonymous: feedbackForm.isAnonymous
      };

      const txHash = await suiContractsService.submitCitizenFeedback(feedback, loginResult);

      setSubmissionStatus({
        type: 'success',
        message: `Feedback submitted successfully! Transaction: ${txHash.slice(0, 10)}...`
      });

      // Reset form
      setFeedbackForm({
        message: '',
        rating: 5,
        isAnonymous: true
      });
      setSelectedProject(null);

      // Reload data to show new feedback
      await loadData();

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setSubmissionStatus({
        type: 'error',
        message: `Failed to submit feedback: ${error.message}`
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: SpendingRecord['status']) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.planned;
  };

  const getStatusIcon = (status: SpendingRecord['status']) => {
    const icons = {
      planned: <Calendar className="h-4 w-4" />,
      ongoing: <TrendingUp className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />
    };
    return icons[status] || icons.planned;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading transparency data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Citizen Portal Header - Only shown as page title, not navbar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Citizen Portal</h1>
                <p className="text-sm text-gray-500">Malaysian Government Transparency</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{loginResult.userInfo.name || 'Anonymous Citizen'}</span>
                <div className="text-xs text-gray-500">
                  {loginResult.userAddress.slice(0, 8)}...{loginResult.userAddress.slice(-6)}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-600">Blockchain Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {submissionStatus.type && (
        <div className={`mx-auto max-w-7xl px-4 py-3 ${
          submissionStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        } border-l-4`}>
          <div className="flex items-center">
            {submissionStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span className={`text-sm font-medium ${
              submissionStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {submissionStatus.message}
            </span>
            <button
              onClick={() => setSubmissionStatus({ type: null, message: '' })}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs - Styled to match MYDS */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'projects', label: 'Government Projects', icon: Building },
              { id: 'analytics', label: 'Spending Analytics', icon: BarChart3 },
              { id: 'feedback', label: 'My Feedback', icon: MessageSquare },
              { id: 'history', label: 'My Activity', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Government Projects</h2>
              <div className="text-sm text-gray-600">
                {spendingRecords.length} active projects • Total allocated: {formatCurrency(
                  spendingRecords.reduce((sum, r) => sum + r.allocatedAmount, 0)
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {spendingRecords.map(record => (
                <div key={record.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 capitalize">{record.status}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProject(record)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Give Feedback
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {record.projectName}
                    </h3>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {record.department}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {record.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {record.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Budget Progress</span>
                        <span className="font-medium">
                          {Math.round((record.spentAmount / record.allocatedAmount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((record.spentAmount / record.allocatedAmount) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Spent: {formatCurrency(record.spentAmount)}</span>
                        <span>Allocated: {formatCurrency(record.allocatedAmount)}</span>
                      </div>
                    </div>

                    {record.contractor && (
                      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                        Contractor: {record.contractor}
                      </div>
                    )}

                    {record.txHash && (
                      <div className="mt-2 text-xs text-gray-400">
                        On-chain: {record.txHash.slice(0, 10)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Spending Analytics</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Spending</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalSpending)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalProjects}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Citizen Feedback</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalFeedback}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Transparency Score</p>
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spending by Department */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Department</h3>
              <div className="space-y-4">
                {analytics.spendingByDepartment.map((dept: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-32 text-sm text-gray-600">{dept.department}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <div className="w-24 text-sm font-medium text-right">
                      {formatCurrency(dept.amount)}
                    </div>
                    <div className="w-12 text-sm text-gray-500 text-right">
                      {dept.percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'feedback' && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Your Feedback History</h3>
            <p className="text-gray-600">Track your contributions to government transparency</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            <p className="text-gray-600">Your blockchain activity and contributions</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Feedback for: {selectedProject.projectName}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedProject.department}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate this project
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating }))}
                        className={`p-1 ${
                          rating <= feedbackForm.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your feedback
                  </label>
                  <textarea
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your thoughts about this project..."
                  />
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feedbackForm.isAnonymous}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Submit anonymously (recommended for privacy)
                  </label>
                </div>

                {/* Privacy Notice */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Privacy Protected:</span> Your feedback will be submitted via zero-knowledge proof. 
                    Even if not anonymous, your identity remains cryptographically protected on the blockchain.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback || !feedbackForm.message.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;