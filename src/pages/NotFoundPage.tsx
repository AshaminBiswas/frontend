import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#EACEAA]/20 py-16 px-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-md w-full bg-white rounded-tr-3xl rounded-bl-3xl p-8 text-center border border-[#34150F]/8 shadow-sm">
        <AlertCircle size={48} className="text-[#D39858] mx-auto mb-3" />
        <h1 className="text-3xl font-black text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>
          404 — Page Not Found
        </h1>
        <p className="text-xs text-[#85431E] mb-6">
          The hardware route or product page you are looking for does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
        >
          <ArrowLeft size={15} /> Return to Storefront Home
        </Link>
      </div>
    </div>
  );
}
