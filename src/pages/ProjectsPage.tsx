import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  MapPin,
  Globe2,
  ShieldCheck,
  ArrowRight,
  Filter,
  RefreshCw,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { projectService } from "../services/projectService";
import { Project, ProjectLocationCluster } from "../types/project";
import { IndiaMap } from "../components/projects/IndiaMap";
import { ProjectCard } from "../components/projects/ProjectCard";
import { ProjectFilterBar } from "../components/projects/ProjectFilterBar";
import { ProjectDetailModal } from "../components/projects/ProjectDetailModal";

const ITEMS_PER_PAGE = 10;

// Helper to generate smart pagination range with ellipses
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("ellipsis");
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<ProjectLocationCluster[]>([]);
  const [panIndiaCount, setPanIndiaCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Load Map Locations Summary
  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await projectService.getMapLocations();
        if (data) {
          setClusters(data.clusters || []);
          setPanIndiaCount(data.panIndiaCount || 0);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      }
    }
    loadMapData();
  }, []);

  // Load Projects with Filters
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 150 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== "ALL") params.category = selectedCategory;

      if (selectedCity === "Pan India") {
        params.isPanIndia = "true";
      } else if (selectedCity) {
        params.city = selectedCity;
      }

      const res = await projectService.getProjects(params);
      setProjects(res.projects || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedCity]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedCity]);

  const handleSelectCity = (city: string | null) => {
    setSelectedCity(city);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedCity(null);
    setCurrentPage(1);
  };

  // Distinct city names for the filter dropdown
  const uniqueCities = useMemo(() => {
    const citySet = new Set<string>();
    clusters.forEach((c) => {
      if (c.city && c.city !== "Pan India") citySet.add(c.city);
    });
    return Array.from(citySet).sort();
  }, [clusters]);

  // ─── Pagination Calculations (10 Cards per Page) ───
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE) || 1;

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return projects.slice(start, start + ITEMS_PER_PAGE);
  }, [projects, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);

    // Smooth scroll to top of project list on page change
    const targetElement = document.getElementById("portfolio-grid");
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#34150F]">
      {/* ─── Hero Header Banner (Responsive) ─── */}
      <section className="relative bg-gradient-to-b from-[#34150F] via-[#2A110B] to-[#1C0905] text-[#EACEAA] py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 border-b border-[#D39858]/30 overflow-hidden">
        {/* Background Architectural Glows */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#D39858]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#85431E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-3 sm:space-y-4">
          <h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#FDFDF4] tracking-tight leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Our Presence &amp; Projects Across India
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-[#EACEAA]/80 max-w-3xl mx-auto leading-relaxed px-2">
            From the Parliament House, DMRC Metro Rail, and national stadiums to global IT campuses, healthcare networks, and luxury clubhouses — PRC Hardware powers India&apos;s most prestigious architectural projects.
          </p>

          {/* National Footprint Trust Metrics (Responsive 2x2 on mobile, 4 in a row on desktop) */}
          <div className="pt-4 sm:pt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#34150F]/80 border border-[#D39858]/30 text-center">
              <p className="text-xl sm:text-3xl font-extrabold text-[#D39858]">130+</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#EACEAA]/70 uppercase tracking-wider mt-0.5">
                Completed Projects
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#34150F]/80 border border-[#D39858]/30 text-center">
              <p className="text-xl sm:text-3xl font-extrabold text-[#D39858]">25+</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#EACEAA]/70 uppercase tracking-wider mt-0.5">
                Cities Covered
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#34150F]/80 border border-[#D39858]/30 text-center">
              <p className="text-xl sm:text-3xl font-extrabold text-[#D39858]">15+</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#EACEAA]/70 uppercase tracking-wider mt-0.5">
                Pan India Chains
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#34150F]/80 border border-[#D39858]/30 text-center">
              <p className="text-xl sm:text-3xl font-extrabold text-emerald-400">100%</p>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#EACEAA]/70 uppercase tracking-wider mt-0.5">
                Grade-A Quality
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* ═══ SECTION 1: Interactive Zoomable India Map ═══ */}
        <section className="space-y-3">
          <IndiaMap
            clusters={clusters}
            panIndiaCount={panIndiaCount}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            onSelectProject={async (id) => {
              const p = await projectService.getProjectById(id);
              if (p) setSelectedProject(p);
            }}
          />
        </section>

        {/* ═══ SECTION 2: Advanced Filter Bar ═══ */}
        <section id="portfolio-grid" className="scroll-mt-6">
          <ProjectFilterBar
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedCity={selectedCity || "ALL"}
            onCityChange={(city) => setSelectedCity(city === "ALL" ? null : city)}
            cities={uniqueCities}
            totalResults={projects.length}
            onResetFilters={handleResetFilters}
          />
        </section>

        {/* ═══ SECTION 3: Projects Portfolio Grid (10 Cards per Page) ═══ */}
        <section className="space-y-6">
          {loading ? (
            <div className="py-24 text-center text-gray-500 flex flex-col items-center gap-3">
              <RefreshCw size={28} className="animate-spin text-[#85431E]" />
              <p className="text-sm font-semibold">Loading completed project installations...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 sm:py-20 text-center rounded-3xl bg-white border border-[#34150F]/10 p-6 sm:p-8 space-y-4 shadow-sm">
              <Building2 size={40} className="mx-auto text-gray-300" />
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                No installations match your criteria
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                Try searching for a different client or reset your category and location filters to view all 130+ projects.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-[#34150F] text-[#EACEAA] text-xs font-bold hover:bg-[#4A1F17] transition-all shadow-sm active:scale-95"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Responsive Cards Grid (1 col on mobile, 2 cols on tablet/medium, 3 on lg, 4 on xl) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </div>

              {/* ─── Luxury Architectural Pagination Controls (10 Per Page) ─── */}
              {totalPages > 1 && (
                <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#34150F]/10">
                  {/* Results Count Summary */}
                  <p className="text-xs sm:text-sm text-gray-500 font-medium order-2 sm:order-1 text-center sm:text-left">
                    Showing{" "}
                    <span className="font-bold text-[#34150F]">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-[#34150F]">
                      {Math.min(currentPage * ITEMS_PER_PAGE, projects.length)}
                    </span>{" "}
                    of <span className="font-bold text-[#34150F]">{projects.length}</span> completed projects
                  </p>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                    {/* First Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-white border-gray-200 text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] hover:border-[#34150F] active:scale-95 shadow-xs"
                      title="First Page"
                      aria-label="Go to first page"
                    >
                      <ChevronsLeft size={15} />
                    </button>

                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-white border-gray-200 text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] hover:border-[#34150F] active:scale-95 shadow-xs"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={15} />
                      <span className="hidden md:inline">Prev</span>
                    </button>

                    {/* Numbered Page Buttons */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                        if (p === "ellipsis") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1.5 sm:px-2 py-1 text-xs text-gray-400 font-bold select-none"
                            >
                              …
                            </span>
                          );
                        }
                        const isCurrent = currentPage === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center ${
                              isCurrent
                                ? "bg-[#34150F] text-[#EACEAA] shadow-md border border-[#D39858] scale-105"
                                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 active:scale-95 shadow-xs"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-white border-gray-200 text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] hover:border-[#34150F] active:scale-95 shadow-xs"
                      aria-label="Next Page"
                    >
                      <span className="hidden md:inline">Next</span>
                      <ChevronRight size={15} />
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-white border-gray-200 text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] hover:border-[#34150F] active:scale-95 shadow-xs"
                      title="Last Page"
                      aria-label="Go to last page"
                    >
                      <ChevronsRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══ SECTION 4: Commercial & Architectural Quotation CTA (Responsive) ═══ */}
        <section className="rounded-3xl bg-gradient-to-r from-[#34150F] via-[#2E120D] to-[#1C0905] text-[#EACEAA] p-6 sm:p-10 md:p-12 border border-[#D39858]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D39858] uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Architectural Consultation &amp; Bulk Procurement</span>
            </div>
            <h3
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FDFDF4]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Planning a Landmark Project?
            </h3>
            <p className="text-xs sm:text-sm text-[#EACEAA]/80 max-w-xl leading-relaxed">
              Get technical architectural hardware specifications, CAD layout drawings, customized PVD finishes, and tiered commercial wholesale pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <Link
              to="/request-quote"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-[#D39858] hover:bg-[#EACEAA] text-[#34150F] text-xs sm:text-sm font-extrabold transition-all active:scale-95 shadow-md hover:shadow-[#D39858]/20"
            >
              <span>Request Quotation</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              to="/contact"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-[#EACEAA] text-xs sm:text-sm font-bold transition-all border border-[#EACEAA]/20"
            >
              <PhoneCall size={14} />
              <span>Contact Specialists</span>
            </Link>
          </div>
        </section>
      </div>

      {/* ─── Project Details Dossier Modal ─── */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

export default ProjectsPage;
