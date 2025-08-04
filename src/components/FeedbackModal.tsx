import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface FeedbackModalProps {
  projectId: string;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ projectId, onClose }) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would typically send the feedback to your backend
    console.log('Feedback submitted:', {
      projectId,
      rating,
      comment,
      citizenName,
      date: new Date().toISOString()
    });
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{t('feedback.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              {t('feedback.rating')}
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform transform hover:scale-110"
                >
                  <Star className={`h-8 w-8 transition-colors ${
                    star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`} />
                </button>
              ))}
              <p className="text-base text-gray-600 ml-4 font-semibold">
                {rating > 0 && ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][rating - 1]}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">
              {t('feedback.comment')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y transition"
              placeholder="Share your thoughts about this project..."
              required
            />
          </div>
          
          <div className="pt-4 flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-800 font-bold rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2.5" />
                  {t('feedback.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
