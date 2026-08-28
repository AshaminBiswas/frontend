import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Building2,
  MapPin,
  Globe2,
  Calendar,
  Layers,
  Video,
  Sparkles,
  Share2,
  Check,
} from "lucide-react";
import { Project } from "../../types/project";

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"gallery" | "video">("gallery");

  useEffect(() => {
    setCurrentImageIdx(0);
    setActiveTab("gallery");
  }, [project]);

  // Keyboard navigation for image carousel & escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project) return;
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, isFullscreen, currentImageIdx]);

  if (!project) return null;

  const images = project.images && project.images.length > 0
    ? project.images
    : ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"];

  const handlePrevImage = () => {
    setCurrentImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if video is YouTube, Vimeo, or direct MP4
  const renderVideoPlayer = (url: string) => {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`}
          title={project.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-2xl"
        />
      );
    }

    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`}
          title={project.name}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-2xl"
        />
      );
    }

    return (
      <video
        src={url}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain rounded-2xl bg-black"
      />
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-3xl shadow-2xl border border-[#34150F]/20 overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full max-w-none rounded-none"
            : "w-full max-w-5xl max-h-[92vh] my-auto"
        }`}
      >
        {/* ─── Modal Header Bar ─── */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 bg-[#34150F] text-[#EACEAA] flex-shrink-0 border-b border-[#D39858]/30">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <Building2 size={20} className="text-[#D39858] flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D39858]">
                {project.category}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#FDFDF4] truncate leading-tight">
                {project.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#EACEAA] transition-colors"
              title="Share project link"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#EACEAA] transition-colors hidden sm:inline-flex"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Modal Body Content (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* Gallery / Video Media Switcher Tabs */}
          {project.videoUrl && (
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("gallery")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "gallery"
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Photo Gallery ({images.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "video"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-rose-600"
                }`}
              >
                <Video size={13} />
                <span>16:9 Landscape Video</span>
              </button>
            </div>
          )}

          {/* ═══ Main Showcase Viewport: 16:9 Aspect Ratio ═══ */}
          <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-lg">
            {activeTab === "gallery" ? (
              <>
                <img
                  src={images[currentImageIdx]}
                  alt={`${project.name} - View ${currentImageIdx + 1}`}
                  className="w-full h-full object-contain"
                />

                {/* Left & Right Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous project image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-transform active:scale-90"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next project image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-transform active:scale-90"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Counter Overlay */}
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold backdrop-blur-xs">
                  {currentImageIdx + 1} / {images.length}
                </div>
              </>
            ) : (
              project.videoUrl && renderVideoPlayer(project.videoUrl)
            )}
          </div>

          {/* ─── Thumbnail Rail for Photo Gallery ─── */}
          {activeTab === "gallery" && images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIdx(idx)}
                  className={`relative w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                    currentImageIdx === idx
                      ? "ring-3 ring-[#85431E] scale-105 shadow-md"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ─── Architectural Project Metadata Grid ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            {/* Left 2 Cols: Description & Details */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#85431E]">
                  Client Organization
                </span>
                <h2
                  className="text-xl sm:text-2xl font-extrabold text-[#34150F]"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  {project.clientName}
                </h2>
              </div>

              {project.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Architectural Installation Scope
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Products Installed Showcase */}
              {project.productsUsed && project.productsUsed.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#85431E]" />
                    <span>PRC Hardware Fittings Installed</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.productsUsed.map((prod, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34150F] bg-[#FAF6F0] px-3 py-1.5 rounded-xl border border-[#34150F]/15 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D39858]" />
                        <span>{prod}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Quick Facts Card */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#34150F]/10 space-y-3.5 text-xs">
              <h4 className="font-extrabold text-[#34150F] uppercase tracking-wider text-xs border-b border-[#34150F]/10 pb-2">
                Project Key Facts
              </h4>

              <div>
                <p className="text-gray-500 font-semibold">Location</p>
                <p className="font-bold text-[#34150F] flex items-center gap-1 mt-0.5">
                  {project.isPanIndia ? (
                    <>
                      <Globe2 size={13} className="text-amber-600" />
                      <span>Pan India (Multi-City Rollout)</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={13} className="text-[#85431E]" />
                      <span>
                        {project.city}, {project.state}
                      </span>
                    </>
                  )}
                </p>
                {project.location && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{project.location}</p>
                )}
              </div>

              <div>
                <p className="text-gray-500 font-semibold">Architectural Category</p>
                <p className="font-bold text-[#34150F] mt-0.5">{project.category}</p>
              </div>

              {project.completionYear && (
                <div>
                  <p className="text-gray-500 font-semibold">Completion Year</p>
                  <p className="font-bold text-[#34150F] flex items-center gap-1 mt-0.5">
                    <Calendar size={13} className="text-[#85431E]" />
                    <span>{project.completionYear}</span>
                  </p>
                </div>
              )}

              <div>
                <p className="text-gray-500 font-semibold">Specification Quality</p>
                <p className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Sparkles size={13} /> Grade-A Architectural Hardware
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailModal;
