import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WriteReviewModal({ productId, productName, onClose, onSuccess }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!title.trim()) { setError('Please add a review title.'); return; }
    if (comment.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }
    setLoading(true); setError('');
    const res = await reviewService.createReview({ productId, rating, title: title.trim(), comment: comment.trim() });
    setLoading(false);
    if (res.success) onSuccess();
    else setError(res.error?.message || 'Failed to submit review.');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl w-full max-w-md p-7 shadow-2xl border border-[rgba(52,21,15,0.1)] animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-tr-lg rounded-bl-lg bg-[#34150F]/10 flex items-center justify-center hover:bg-[#34150F]/20 transition-colors">
          <X size={16} className="text-[#34150F]" />
        </button>

        <h2 className="text-xl font-bold text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>Write a Review</h2>
        <p className="text-sm text-[#85431E] mb-6 truncate">{productName}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-2">Your Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={30}
                    fill={(hovered || rating) >= star ? '#D39858' : 'none'}
                    stroke={(hovered || rating) >= star ? '#D39858' : '#85431E'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-[#D39858] font-semibold mt-1">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Review Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Your Review *</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share details about quality, fit, and your overall experience..."
              rows={4}
              className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors resize-none"
            />
            <p className="text-[10px] text-[#85431E]/50 mt-1">{comment.length} characters</p>
          </div>

          {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-tr-xl rounded-bl-xl font-semibold text-sm text-[#85431E] border border-[rgba(52,21,15,0.15)] hover:bg-[#34150F]/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-tr-xl rounded-bl-xl font-bold text-sm bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] transition-colors disabled:opacity-60">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
