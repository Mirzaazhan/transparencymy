import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { StarIcon, ArrowForwardIcon } from '@govtechmy/myds-react/icon';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@govtechmy/myds-react/dialog';
import { Button } from '@govtechmy/myds-react/button';
import { Input } from '@govtechmy/myds-react/input';
import { TextArea } from '@govtechmy/myds-react/textarea';

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
    <Dialog open onOpenChange={onClose}>
      <DialogBody>
        <DialogHeader>
          <DialogTitle>{t('feedback.title')}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
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
                    <StarIcon className={`h-8 w-8 transition-colors ${
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
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Share your thoughts about this project..."
                required
              />
            </div>
          </form>
        </DialogContent>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="default-outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowForwardIcon className="h-5 w-5 mr-2.5" />
                {t('feedback.submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogBody>
    </Dialog>
  );
};

export default FeedbackModal;
