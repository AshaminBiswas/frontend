import { Star } from "lucide-react";

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          fill={s <= rating ? "#D39858" : "none"}
          stroke={s <= rating ? "#D39858" : "#85431E"}
        />
      ))}
    </div>
  );
}
