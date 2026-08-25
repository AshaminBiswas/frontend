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
    <div className="space-y-3 sm:space-y-4">

      {/* ═══════════════ COMPACT RATING SUMMARY & HEADER ═══════════════ */}
      <div className="flex flex-row items-center justify-between bg-[#EACEAA]/40 p-2.5 sm:p-4 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.08)] gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-[#34150F] text-[#EACEAA] py-1 px-2.5 sm:py-1.5 sm:px-3 rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg text-center shadow-inner">
            <span className="text-base sm:text-xl font-black block leading-none" style={{ fontFamily: "'DM Mono', monospace" }}>
              {averageRating.toFixed(1)}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#D39858]">/ 5.0</span>
          </div>

          <div>
            <div className="flex gap-0.5 mb-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className="sm:w-3.5 sm:h-3.5"
                  fill={s <= Math.round(averageRating) ? "#D39858" : "none"}
                  stroke="#D39858"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <p className="text-[10.5px] sm:text-xs font-extrabold text-[#34150F]">
              {totalReviews} {totalReviews === 1 ? "Customer Review" : "Customer Reviews"}
            </p>
          </div>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="bg-[#34150F] text-[#EACEAA] text-[10.5px] sm:text-xs font-bold px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs"
          >
            Sign in
          </button>
        )}
      </div>

      {/* ═══════════════ COMPACT PRODUCT REVIEW FORM ═══════════════ */}
      <div className="bg-[#f5e8d4] p-2.5 sm:p-5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl border border-[rgba(52,21,15,0.1)] shadow-2xs">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-1.5 sm:pb-2 border-b border-[rgba(52,21,15,0.08)]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MessageSquare className="text-[#D39858]" size={14} />
            <h3 className="text-xs sm:text-sm font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Write a Review
            </h3>
          </div>

          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#85431E]/70 font-mono bg-[#EACEAA]/40 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded border border-[rgba(52,21,15,0.06)]">
            <Sparkles size={9} className="text-[#D39858]" />
            <span>ID: <strong className="text-[#34150F]">{productId.slice(0, 6)}...</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmitReview} className="space-y-2.5 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-end">
            
            {/* Rating Selector */}
            <div className="sm:col-span-5">
              <label className="block text-[9px] sm:text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-0.5 sm:mb-1">
                Rating <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center gap-0.5 sm:gap-1 bg-[#EACEAA]/40 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg border border-[rgba(52,21,15,0.12)]">
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
                      size={15}
                      className="sm:w-[18px] sm:h-[18px]"
                      fill={star <= (hoverRating || rating) ? "#D39858" : "none"}
                      stroke="#D39858"
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
                <span className="ml-1.5 sm:ml-2 text-[10.5px] sm:text-xs font-black text-[#34150F]">
                  {hoverRating || rating}/5
                </span>
              </div>
            </div>

            {/* NAME Field */}
            <div className="sm:col-span-7">
              <label htmlFor="review-title" className="block text-[9px] sm:text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-0.5 sm:mb-1">
                NAME <span className="text-red-600">*</span>
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#EACEAA]/30 border border-[rgba(52,21,15,0.12)] rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg text-[11px] sm:text-xs font-bold text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
              />
            </div>

          </div>

          {/* Comment Field */}
          <div>
            <label htmlFor="review-comment" className="block text-[9px] sm:text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-0.5 sm:mb-1">
              Comment <span className="text-red-600">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Build quality is top notch. Great efficiency..."
              required
              className="w-full px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#EACEAA]/30 border border-[rgba(52,21,15,0.12)] rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg text-[11px] sm:text-xs font-medium text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-y"
            />
          </div>

          {/* Error / Success feedback */}
          {submitError && (
            <div className="flex items-center gap-1.5 p-1.5 sm:p-2 bg-red-100 border border-red-300 text-red-800 text-[10.5px] sm:text-xs font-bold rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="flex items-center gap-1.5 p-1.5 sm:p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10.5px] sm:text-xs font-bold rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg">
              <CheckCircle2 size={13} className="flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-0.5">
            <button
              type="submit"
              disabled={submitting}
              className="py-1.5 sm:py-2 px-4 sm:px-6 bg-[#34150F] text-[#EACEAA] font-bold text-[10.5px] sm:text-xs rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={12} /> Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ═══════════════ COMPACT REVIEWS CARDS ═══════════════ */}
      <div className="space-y-2 sm:space-y-3">
        <h4 className="text-[11px] sm:text-xs font-extrabold text-[#34150F] uppercase tracking-wider">
          Reviews ({totalReviews})
        </h4>

        {loadingReviews ? (
          <div className="flex items-center justify-center p-3 sm:p-4 bg-[#EACEAA]/20 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl gap-2">
            <Loader2 size={14} className="animate-spin text-[#34150F]" />
            <span className="text-[11px] sm:text-xs font-bold text-[#85431E]">Loading reviews...</span>
          </div>
        ) : fetchError ? (
          <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-md rounded-bl-md sm:rounded-tr-lg sm:rounded-bl-lg text-[11px] sm:text-xs font-bold flex items-center justify-between">
            <span>{fetchError}</span>
            <button type="button" onClick={loadReviews} className="underline text-[11px] sm:text-xs">
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-4 sm:p-5 text-center bg-[#EACEAA]/30 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.08)]">
            <p className="text-[11px] sm:text-xs font-bold text-[#34150F]">No reviews yet.</p>
            <p className="text-[10px] sm:text-[11px] text-[#85431E]/70 mt-0.5">Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((rev, index) => (
              <div
                key={rev.id || rev._id || index}
                className="bg-[#f5e8d4] p-2.5 sm:p-3.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.08)] shadow-2xs space-y-1 sm:space-y-1.5 transition-all hover:border-[#D39858]/40"
              >
                <div className="flex items-center justify-between gap-1.5 border-b border-[rgba(52,21,15,0.06)] pb-1 sm:pb-1.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#34150F] text-[#EACEAA] flex items-center justify-center font-black text-[9px] sm:text-[10px]">
                      {getAuthorName(rev).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10.5px] sm:text-xs font-extrabold text-[#34150F]">
                      {getAuthorName(rev)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          className="sm:w-[11px] sm:h-[11px]"
                          fill={s <= rev.rating ? "#D39858" : "none"}
                          stroke="#D39858"
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[#85431E]/60 font-semibold flex items-center gap-0.5">
                      <Calendar size={9} /> {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                {rev.title && (
                  <h5 className="text-[10.5px] sm:text-xs font-black text-[#34150F]">
                    {rev.title}
                  </h5>
                )}

                <p className="text-[10.5px] sm:text-xs text-[#85431E] leading-snug">
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
