import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Send, CheckCircle2, AlertCircle, Calendar, Loader2, Sparkles } from "lucide-react";
import { reviewService, Review } from "../../services/reviewService";
import { useAuth } from "../../context/AuthContext";

interface ProductReviewSectionProps {
  productId: string;
  productName?: string;
}

export function ProductReviewSection({ productId, productName }: ProductReviewSectionProps) {
  const { user, openAuthModal } = useAuth();

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Summary state
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(5.0);

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch reviews from GET : {{baseUrl}}/reviews/product/:productId?page=1&limit=20
  const loadReviews = useCallback(async () => {
    if (!productId) return;
    setLoadingReviews(true);
    setFetchError(null);

    try {
      const res = await reviewService.getProductReviews(productId, 1, 20);

      if (res.success && res.data) {
        let reviewList: Review[] = [];
        let total = 0;
        let avg = 5.0;

        if (Array.isArray(res.data)) {
          reviewList = res.data;
          total = reviewList.length;
        } else if (res.data && typeof res.data === "object") {
          reviewList = res.data.reviews || res.data.data || res.data.items || [];
          total = res.data.total ?? res.data.count ?? reviewList.length;
          avg = res.data.averageRating ?? res.data.avgRating ?? res.data.rating ?? 5.0;
        }

        // Calculate avg if not provided
        if (reviewList.length > 0 && !res.data.averageRating) {
          const sum = reviewList.reduce((acc, r) => acc + (r.rating || 5), 0);
          avg = Number((sum / reviewList.length).toFixed(1));
        }

        setReviews(reviewList);
        setTotalReviews(total);
        setAverageRating(avg);
      } else {
        setFetchError(res.error?.message || "Failed to load product reviews.");
      }
    } catch {
      setFetchError("Error connecting to reviews server.");
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Submit new review via POST : {{baseUrl}}/reviews
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);
    setSubmitError(null);

    if (!rating || rating < 1 || rating > 5) {
      setSubmitError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!title.trim()) {
      setSubmitError("Please enter your NAME.");
      return;
    }

    if (!comment.trim()) {
      setSubmitError("Please enter your review comment.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      };

      const res = await reviewService.createReview(payload);

      if (res.success) {
        setSubmitSuccess("Thank you! Review submitted successfully.");
        setTitle("");
        setComment("");
        setRating(5);
        loadReviews();
      } else {
        setSubmitError(res.error?.message || "Failed to submit review.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while posting your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthorName = (rev: Review) => {
    if (rev.userName) return rev.userName;
    if (rev.user) {
      if (rev.user.name) return rev.user.name;
      if (rev.user.firstName) {
        return `${rev.user.firstName} ${rev.user.lastName || ""}`.trim();
      }
      if (rev.user.email) return rev.user.email.split("@")[0];
    }
    return "Verified Buyer";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-4">

      {/* ═══════════════ COMPACT RATING SUMMARY & HEADER ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#EACEAA]/40 p-4 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#34150F] text-[#EACEAA] py-1.5 px-3 rounded-tr-lg rounded-bl-lg text-center shadow-inner">
            <span className="text-xl font-black block leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
              {averageRating.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#D39858]">/ 5.0</span>
          </div>

          <div>
            <div className="flex gap-0.5 mb-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(averageRating) ? "#D39858" : "none"}
                  stroke="#D39858"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="text-xs font-extrabold text-[#34150F]">
              {totalReviews} {totalReviews === 1 ? "Customer Review" : "Customer Reviews"}
            </p>
          </div>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-4 py-1.5 rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-xs"
          >
            Sign in to Review
          </button>
        )}
      </div>

      {/* ═══════════════ COMPACT PRODUCT REVIEW FORM ═══════════════ */}
      <div className="bg-[#f5e8d4] p-4 sm:p-5 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.1)] shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[rgba(52,21,15,0.08)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-[#D39858]" size={16} />
            <h3 className="text-sm font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Write a Review
            </h3>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#85431E]/70 font-mono bg-[#EACEAA]/40 px-2 py-0.5 rounded border border-[rgba(52,21,15,0.06)]">
            <Sparkles size={10} className="text-[#D39858]" />
            <span>ID: <strong className="text-[#34150F]">{productId.slice(0, 8)}...</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            
            {/* Rating Selector */}
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                Rating <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-1 bg-[#EACEAA]/40 px-2.5 py-1.5 rounded-tr-lg rounded-bl-lg border border-[rgba(52,21,15,0.12)]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={18}
                      fill={star <= (hoverRating || rating) ? "#D39858" : "none"}
                      stroke="#D39858"
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-black text-[#34150F]">
                  {hoverRating || rating}/5
                </span>
              </div>
            </div>

            {/* NAME Field */}
            <div className="sm:col-span-7">
              <label htmlFor="review-title" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                NAME <span className="text-red-600">*</span>
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full px-3 py-1.5 bg-[#EACEAA]/30 border border-[rgba(52,21,15,0.12)] rounded-tr-lg rounded-bl-lg text-xs font-bold text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
              />
            </div>

          </div>

          {/* Comment Field */}
          <div>
            <label htmlFor="review-comment" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
              Comment <span className="text-red-600">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Build quality is top notch. Great efficiency..."
              required
              className="w-full px-3 py-1.5 bg-[#EACEAA]/30 border border-[rgba(52,21,15,0.12)] rounded-tr-lg rounded-bl-lg text-xs font-medium text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-y"
            />
          </div>

          {/* Error / Success feedback */}
          {submitError && (
            <div className="flex items-center gap-1.5 p-2 bg-red-100 border border-red-300 text-red-800 text-xs font-bold rounded-tr-lg rounded-bl-lg">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="flex items-center gap-1.5 p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-tr-lg rounded-bl-lg">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="py-2 px-6 bg-[#34150F] text-[#EACEAA] font-bold text-xs rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={13} /> Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ═══════════════ COMPACT REVIEWS CARDS ═══════════════ */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-[#34150F] uppercase tracking-wider">
          Reviews ({totalReviews})
        </h4>

        {loadingReviews ? (
          <div className="flex items-center justify-center p-4 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl gap-2">
            <Loader2 size={16} className="animate-spin text-[#34150F]" />
            <span className="text-xs font-bold text-[#85431E]">Loading reviews...</span>
          </div>
        ) : fetchError ? (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-lg rounded-bl-lg text-xs font-bold flex items-center justify-between">
            <span>{fetchError}</span>
            <button type="button" onClick={loadReviews} className="underline text-xs">
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-5 text-center bg-[#EACEAA]/30 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)]">
            <p className="text-xs font-bold text-[#34150F]">No reviews yet.</p>
            <p className="text-[11px] text-[#85431E]/70 mt-0.5">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviews.map((rev, index) => (
              <div
                key={rev.id || rev._id || index}
                className="bg-[#f5e8d4] p-3.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)] shadow-xs space-y-1.5 transition-all hover:border-[#D39858]/40"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[rgba(52,21,15,0.06)] pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#34150F] text-[#EACEAA] flex items-center justify-center font-black text-[10px]">
                      {getAuthorName(rev).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-extrabold text-[#34150F]">
                      {getAuthorName(rev)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          fill={s <= rev.rating ? "#D39858" : "none"}
                          stroke="#D39858"
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#85431E]/60 font-semibold flex items-center gap-0.5">
                      <Calendar size={10} /> {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                {rev.title && (
                  <h5 className="text-xs font-black text-[#34150F]">
                    {rev.title}
                  </h5>
                )}

                <p className="text-xs text-[#85431E] leading-snug">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
