import React from "react";
import { MapPin, Globe2, Building2, Video, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const coverImage =
    project.images && project.images.length > 0
      ? project.images[0]
      : "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop";

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-3xl bg-white border border-[#34150F]/12 shadow-sm hover:shadow-xl hover:border-[#85431E]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden select-none"
    >
      {/* ─── Card Image Top Half ─── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
        <img
          src={coverImage}
          alt={project.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-block px-2.5 py-1 rounded-full bg-[#34150F]/90 backdrop-blur-xs text-[#EACEAA] text-[10px] sm:text-[11px] font-bold tracking-wide border border-[#D39858]/30 shadow-xs">
            {project.category}
          </span>
        </div>

        {/* Media Badges (Top Right) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {project.videoUrl && (
            <span
              title="16:9 Video Attached"
              className="p-1.5 rounded-full bg-rose-600/90 text-white shadow-xs backdrop-blur-xs"
            >
              <Video size={12} />
            </span>
          )}
          {project.isFeatured && (
            <span
              title="Featured Project"
              className="p-1.5 rounded-full bg-amber-500 text-white shadow-xs backdrop-blur-xs"
            >
              <Sparkles size={12} />
            </span>
          )}
        </div>

        {/* Location & Year (Bottom of Image) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-white text-xs font-semibold">
          {project.isPanIndia ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-extrabold bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-400/30">
              <Globe2 size={11} /> Pan India
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#FDFDF4] drop-shadow">
              <MapPin size={11} className="text-[#D39858]" />
              {project.city}, {project.state}
            </span>
          )}

          {project.completionYear && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/80">
              <Calendar size={10} />
              {project.completionYear}
            </span>
          )}
        </div>
      </div>

      {/* ─── Card Content Bottom Half ─── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Client Name */}
          <p className="text-[11px] sm:text-xs font-extrabold text-[#85431E] uppercase tracking-wider line-clamp-1">
            {project.clientName}
          </p>

          {/* Project Title */}
          <h4
            className="text-base sm:text-lg font-bold text-[#34150F] group-hover:text-[#85431E] transition-colors line-clamp-1 mt-0.5"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {project.name}
          </h4>

          {/* Description snippet */}
          {project.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* ─── Hardware Fittings Installed ─── */}
        <div>
          {project.productsUsed && project.productsUsed.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.productsUsed.slice(0, 2).map((item, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium text-[#34150F] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#34150F]/10 truncate max-w-[150px]"
                >
                  {item}
                </span>
              ))}
              {project.productsUsed.length > 2 && (
                <span className="text-[10px] font-bold text-gray-400 self-center">
                  +{project.productsUsed.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Card Footer Action */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#85431E] group-hover:text-[#34150F] transition-colors">
            <span>View Project Dossier</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
