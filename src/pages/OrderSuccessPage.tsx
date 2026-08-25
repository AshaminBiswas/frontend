import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Package, Download, ArrowRight, ShieldCheck } from "lucide-react";

export function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-6 sm:py-16 px-3 sm:px-4 pb-20 sm:pb-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-xl mx-auto bg-white rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl p-5 sm:p-8 md:p-10 border border-[#34150F]/8 shadow-lg text-center">

        <div className="w-14 h-14 sm:w-20 sm:h-20 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm">
          <CheckCircle2 size={32} className="sm:w-11 sm:h-11" />
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#34150F] mb-1.5 sm:mb-2" style={{ fontFamily: "'Gilda Display', serif" }}>
          Order Confirmed!
        </h1>
        <p className="text-xs text-[#85431E] mb-4 sm:mb-6">
          Thank you for choosing PRC Hardware Enterprise. Your order has been registered and sent to the nearest warehouse for dispatch.
        </p>

        <div className="bg-[#EACEAA]/30 border border-[#34150F]/10 rounded-tr-2xl rounded-bl-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#85431E] font-semibold">Order Reference:</span>
            <span className="font-mono font-black text-[#34150F]">{orderId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#85431E] font-semibold">Status:</span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">CONFIRMED</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#85431E] font-semibold">GST Invoice:</span>
            <span className="font-bold text-emerald-600">Generated & Emailed</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/profile/orders"
            className="flex-1 bg-[#34150F] text-[#EACEAA] font-bold py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-xs flex items-center justify-center gap-2 shadow"
          >
            <Package size={15} /> View Order History
          </Link>
          <Link
            to="/products"
            className="flex-1 bg-white text-[#85431E] border border-[#34150F]/20 font-bold py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/30 transition-all text-xs flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </div>
  );
}
