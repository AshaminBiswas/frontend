import React from "react";

export function PageSkeleton() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 py-12" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="w-8 h-8 border-2 border-[#34150F] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-[#85431E]">Loading...</span>
    </div>
  );
}
