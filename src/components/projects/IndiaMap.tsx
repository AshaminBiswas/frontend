import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  MapPin,
  Globe2,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { useDraggableScroll } from "../../hooks/useDraggableScroll";
import { ProjectLocationCluster } from "../../types/project";
import INDIA_VECTOR from "../../data/india-exact-vector.json";

interface IndiaMapProps {
  clusters: ProjectLocationCluster[];
  panIndiaCount: number;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  onSelectProject?: (projectId: string) => void;
}

// Center of the 800 x 900 SVG projection canvas
const SVG_CENTER_X = 400;
const SVG_CENTER_Y = 450;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4.5;

// Convert real GPS (lat, lng) to the exact SVG coordinate system
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const minLat = 6.5;
  const maxLat = 37.5;
  const minLng = 68.0;
  const maxLng = 97.5;
  const width = 800;
  const height = 900;
  const padding = 20;

  const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * padding);
  const y = padding + ((maxLat - lat) / (maxLat - minLat)) * (height - 2 * padding);
  return { x: Math.round(x), y: Math.round(y) };
}

export function IndiaMap({
  clusters,
  panIndiaCount,
  selectedCity,
  onSelectCity,
  onSelectProject,
}: IndiaMapProps) {
  const [hoveredCluster, setHoveredCluster] = useState<ProjectLocationCluster | null>(null);

  // Desktop draggable scroll for Quick Hubs rail
  const {
    containerRef: hubsRef,
    isDragging: isDraggingHubs,
    hasMoved: hasMovedHubs,
    scrollBy: scrollHubsBy,
    dragProps: hubsDragProps,
  } = useDraggableScroll<HTMLDivElement>();

  // ─── Zoom & Pan States ───
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const touchPinchDistRef = useRef<number | null>(null);

  // Top hubs sorted by project count
  const topHubs = useMemo(() => {
    return [...clusters].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [clusters]);

  const activeCluster = useMemo(() => {
    if (!selectedCity || selectedCity === "Pan India") return null;
    return clusters.find((c) => c.city.toLowerCase() === selectedCity.toLowerCase()) || null;
  }, [clusters, selectedCity]);

  // ─── Auto-Zoom to City when selected ───
  const autoFocusCity = useCallback((cityCluster: ProjectLocationCluster) => {
    if (!cityCluster.lat || !cityCluster.lng) return;
    const coords = projectCoords(cityCluster.lat, cityCluster.lng);
    const targetZoom = 2.3;

    // Center target point (coords.x, coords.y) at (SVG_CENTER_X, SVG_CENTER_Y)
    const targetPanX = (SVG_CENTER_X - coords.x) * targetZoom;
    const targetPanY = (SVG_CENTER_Y - coords.y) * targetZoom;

    setIsTransitioning(true);
    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  // Sync zoom when selectedCity changes
  useEffect(() => {
    if (selectedCity && selectedCity !== "Pan India") {
      const match = clusters.find((c) => c.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) autoFocusCity(match);
    } else {
      // Reset zoom to 1x when full country is chosen
      setIsTransitioning(true);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [selectedCity, clusters, autoFocusCity]);

  // ─── Zoom Controls (+, -, Reset) ───
  const handleZoomIn = () => {
    setIsTransitioning(true);
    setZoom((prev) => Math.min(MAX_ZOOM, Number((prev * 1.3).toFixed(2))));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleZoomOut = () => {
    setIsTransitioning(true);
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Number((prev / 1.3).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleReset = () => {
    setIsTransitioning(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectCity(null);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  // ─── Mouse Pan / Drag Handlers ───
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only main left click
    setIsDragging(true);
    setHasMoved(false);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const svgScaleX = 800 / rect.width;
    const svgScaleY = 900 / rect.height;

    const dx = (e.clientX - dragStartRef.current.x) * svgScaleX;
    const dy = (e.clientY - dragStartRef.current.y) * svgScaleY;

    if (Math.hypot(dx, dy) > 4) {
      setHasMoved(true);
    }

    setPan({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ─── Mobile Touch Handlers (Pan & Pinch-to-Zoom) ───
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setHasMoved(false);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 1 && isDragging) {
      const svgScaleX = 800 / rect.width;
      const svgScaleY = 900 / rect.height;
      const dx = (e.touches[0].clientX - dragStartRef.current.x) * svgScaleX;
      const dy = (e.touches[0].clientY - dragStartRef.current.y) * svgScaleY;

      if (Math.hypot(dx, dy) > 4) setHasMoved(true);

      setPan({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy,
      });
    } else if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchPinchDistRef.current;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((prev * ratio).toFixed(2)))));
      touchPinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchPinchDistRef.current = null;
  };

  const handleMarkerClick = (cluster: ProjectLocationCluster, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMoved) return; // ignore click if it was a pan drag
    const isSelected = selectedCity && selectedCity.toLowerCase() === cluster.city.toLowerCase();
    onSelectCity(isSelected ? null : cluster.city);
  };

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#180805] via-[#240D07] to-[#1C0905] border border-[#D39858]/30 shadow-2xl overflow-hidden p-4 sm:p-6 md:p-8">
      {/* ─── Architectural Grid Background Lines ─── */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #D39858 1px, transparent 1px),
            linear-gradient(to bottom, #D39858 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient Accent Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D39858]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#85431E]/15 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top Control Strip ─── */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h3
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#EACEAA] tracking-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Explore Projects Across India
          </h3>
        </div>

        {/* Pan India Special Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectCity(selectedCity === "Pan India" ? null : "Pan India")}
            className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-md ${
              selectedCity === "Pan India"
                ? "bg-[#D39858] text-[#34150F] ring-2 ring-[#EACEAA]"
                : "bg-[#34150F]/80 hover:bg-[#85431E] text-[#EACEAA] border border-[#D39858]/30"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D39858] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D39858]" />
            </span>
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-wider">National Reach</p>
              <p className="text-xs font-bold whitespace-nowrap">
                Pan India Accounts ({panIndiaCount}+)
              </p>
            </div>
            <Sparkles size={14} className="text-[#D39858] group-hover:rotate-12 transition-transform" />
          </button>

          {(selectedCity || zoom > 1 || pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#EACEAA] text-xs font-bold transition-colors"
              title="Reset map view to default"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Quick City Filter Chips (Draggable on Desktop & Touch on Mobile) ─── */}
      <div className="relative group/hubs z-20 flex items-center mb-2 pb-1">
        <span className="text-[11px] font-bold text-[#D39858] uppercase tracking-wider flex-shrink-0 flex items-center gap-1 mr-2 select-none">
          <MapPin size={12} /> Hubs:
        </span>

        {/* Left Scroll Arrow (Desktop) */}
        <button
          type="button"
          onClick={() => scrollHubsBy(-180)}
          className="hidden md:flex absolute left-14 z-20 w-6 h-6 rounded-full bg-[#180805]/95 border border-[#D39858]/50 text-[#EACEAA] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/hubs:opacity-100 shadow-lg items-center justify-center"
          aria-label="Scroll hubs left"
          title="Scroll left"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Draggable Hubs Container */}
        <div
          ref={hubsRef}
          {...hubsDragProps}
          className={`flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 select-none w-full ${
            isDraggingHubs ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (hasMovedHubs.current) return;
              handleReset();
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 select-none ${
              !selectedCity && zoom === 1
                ? "bg-[#D39858] text-[#34150F]"
                : "bg-[#34150F] text-[#EACEAA]/80 hover:bg-[#85431E] border border-[#D39858]/20"
            }`}
          >
            All India
          </button>
          {topHubs.map((hub) => (
            <button
              key={hub.city}
              type="button"
              onClick={() => {
                if (hasMovedHubs.current) return;
                onSelectCity(selectedCity === hub.city ? null : hub.city);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 select-none ${
                selectedCity === hub.city
                  ? "bg-[#D39858] text-[#34150F] shadow-md"
                  : "bg-[#34150F] text-[#EACEAA]/80 hover:bg-[#85431E] border border-[#D39858]/20"
              }`}
            >
              <span>{hub.city}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedCity === hub.city
                    ? "bg-[#34150F] text-[#EACEAA]"
                    : "bg-[#D39858]/20 text-[#D39858]"
                }`}
              >
                {hub.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Scroll Arrow (Desktop) */}
        <button
          type="button"
          onClick={() => scrollHubsBy(180)}
          className="hidden md:flex absolute right-0 z-20 w-6 h-6 rounded-full bg-[#180805]/95 border border-[#D39858]/50 text-[#EACEAA] hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/hubs:opacity-100 shadow-lg items-center justify-center"
          aria-label="Scroll hubs right"
          title="Scroll right"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* ─── Main Architectural Zoomable Canvas Container ─── */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full aspect-[1/1.08] max-h-[720px] mx-auto flex items-center justify-center select-none overflow-hidden rounded-2xl ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Floating Zoom Navigation Controls (+, -, Reset) - Bottom on Mobile, Top-Right on Desktop */}
        <div className="absolute bottom-2 right-2 sm:bottom-auto sm:top-3 sm:right-3 z-30 flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-[#180805]/90 backdrop-blur-md border border-[#D39858]/40 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/15 text-[#EACEAA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} className="sm:w-4 sm:h-4" />
          </button>

          <span className="text-[9px] sm:text-[10px] font-black text-[#D39858] px-1 select-none">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/15 text-[#EACEAA] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} className="sm:w-4 sm:h-4" />
          </button>

          <div className="w-[1px] h-3 sm:w-4 sm:h-[1px] bg-[#D39858]/30 mx-0.5 sm:my-0.5" />

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/15 text-[#EACEAA] transition-colors"
            title="Reset to Full India View"
            aria-label="Reset zoom"
          >
            <RotateCcw size={13} className="sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* ═══ Main SVG Viewport ═══ */}
        <svg
          viewBox={INDIA_VECTOR.viewBox}
          className="w-full h-full pointer-events-none"
          style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6))" }}
        >
          <defs>
            {/* 3D Extrusion Gradient for India Base Shadow */}
            <linearGradient id="indiaBaseExtrusion" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#100503" />
              <stop offset="100%" stopColor="#080201" />
            </linearGradient>

            {/* Top Surface Gradient for India's Territory */}
            <linearGradient id="indiaTopSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3E170F" />
              <stop offset="50%" stopColor="#2D110B" />
              <stop offset="100%" stopColor="#200B06" />
            </linearGradient>

            {/* Glowing Shoreline & Border Stroke */}
            <linearGradient id="goldBorderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D0A9" />
              <stop offset="50%" stopColor="#D39858" />
              <stop offset="100%" stopColor="#85431E" />
            </linearGradient>

            {/* Marker Glow Filter */}
            <filter id="goldMarkerGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ═══ TRANSFORM SURFACE: Applies Pan & Zoom ═══ */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: `${SVG_CENTER_X}px ${SVG_CENTER_Y}px`,
              transition: isTransitioning ? "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
            }}
          >
            {/* ═══ LAYER 1: Subtle Extruded 3D Elevation Drop Shadow ═══ */}
            <g transform="translate(10, 16)" opacity="0.65">
              <path
                d={INDIA_VECTOR.mainPath}
                fill="url(#indiaBaseExtrusion)"
                stroke="#0A0302"
                strokeWidth="3"
              />
              {INDIA_VECTOR.islandPaths.map((p, idx) => (
                <path key={`shadow-isl-${idx}`} d={p} fill="url(#indiaBaseExtrusion)" />
              ))}
            </g>

            {/* ═══ LAYER 2: Authentic Outer Boundary of India ═══ */}
            <g>
              {/* Mainland India */}
              <path
                d={INDIA_VECTOR.mainPath}
                fill="url(#indiaTopSurface)"
                stroke="url(#goldBorderGlow)"
                strokeWidth={2.2 / Math.sqrt(zoom)}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Andaman & Nicobar, Lakshadweep Islands */}
              {INDIA_VECTOR.islandPaths.map((p, idx) => (
                <path
                  key={`isl-${idx}`}
                  d={p}
                  fill="url(#indiaTopSurface)"
                  stroke="url(#goldBorderGlow)"
                  strokeWidth={1.6 / Math.sqrt(zoom)}
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {/* ═══ LAYER 3: Faint Architectural Lat/Lng Coordinates Grid ═══ */}
            <path
              d="M 257,50 L 257,850"
              stroke="#D39858"
              strokeWidth={0.6 / Math.sqrt(zoom)}
              strokeDasharray="3,6"
              opacity="0.2"
            />
            <path
              d="M 80,480 L 720,480"
              stroke="#D39858"
              strokeWidth={0.6 / Math.sqrt(zoom)}
              strokeDasharray="3,6"
              opacity="0.2"
            />

            {/* ═══ LAYER 4: Interactive City Cluster Pins ═══ */}
            {clusters.map((cluster) => {
              if (!cluster.lat || !cluster.lng) return null;
              const coords = projectCoords(cluster.lat, cluster.lng);
              const isSelected =
                selectedCity && selectedCity.toLowerCase() === cluster.city.toLowerCase();
              const isHovered = hoveredCluster?.city === cluster.city;
              const isMajor = cluster.count >= 10;

              // Scale pin inversely with zoom so pins remain razor-sharp and readable at any zoom level
              const pinScale = Math.max(0.65, Math.min(1.2, 1 / Math.pow(zoom, 0.4)));

              return (
                <g
                  key={cluster.city}
                  transform={`translate(${coords.x}, ${coords.y}) scale(${pinScale})`}
                  className="cursor-pointer transition-all duration-200 pointer-events-auto"
                  onClick={(e) => handleMarkerClick(cluster, e)}
                  onMouseEnter={() => setHoveredCluster(cluster)}
                  onMouseLeave={() => setHoveredCluster(null)}
                >
                  {/* Outer animated radar pulse ring on major hubs */}
                  {isMajor && (
                    <circle
                      r={isSelected ? 24 : 18}
                      fill="none"
                      stroke="#D39858"
                      strokeWidth="1.5"
                      opacity="0.65"
                      className="animate-ping"
                      style={{ transformOrigin: "0 0", animationDuration: "2.4s" }}
                    />
                  )}

                  {/* Pin Core Glow */}
                  <circle
                    r={isSelected ? 14 : isMajor ? 10 : 8}
                    fill={isSelected ? "#F2C082" : isMajor ? "#D39858" : "#85431E"}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#goldMarkerGlow)"
                  />

                  {/* Inner Center Dot */}
                  <circle r={isSelected ? 4 : 2.5} fill="#34150F" />

                  {/* City Label & Project Count Badge */}
                  <g
                    transform={`translate(0, ${coords.y > 750 ? -22 : 24})`}
                    className={`transition-all duration-200 ${
                      isSelected || isHovered ? "scale-110" : "scale-100"
                    }`}
                    style={{ transformOrigin: "0 0" }}
                  >
                    <rect
                      x="-44"
                      y="-12"
                      width="88"
                      height="24"
                      rx="12"
                      fill={isSelected ? "#D39858" : "#180805"}
                      stroke={isSelected ? "#FFFFFF" : "#D39858"}
                      strokeWidth={isSelected ? 1.8 : 1}
                      opacity="0.95"
                      filter="url(#goldMarkerGlow)"
                    />
                    <text
                      x="-6"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? "#34150F" : "#EACEAA"}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="'Nunito', sans-serif"
                    >
                      {cluster.city.length > 8 ? cluster.city.slice(0, 7) + "…" : cluster.city}
                    </text>
                    <circle
                      cx="28"
                      cy="0"
                      r="8"
                      fill={isSelected ? "#34150F" : "#85431E"}
                    />
                    <text
                      x="28"
                      y="3"
                      textAnchor="middle"
                      fill={isSelected ? "#EACEAA" : "#FFFFFF"}
                      fontSize="9"
                      fontWeight="800"
                    >
                      {cluster.count}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* ─── Interactive City Project Spotlight Card (Compact on Mobile) ─── */}
        {activeCluster && (
          <div className="absolute bottom-2 left-2 sm:left-auto sm:right-4 sm:bottom-4 z-30 w-52 sm:w-80 max-w-[calc(100%-145px)] sm:max-w-none p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-[#180805]/95 backdrop-blur-md border border-[#D39858] shadow-2xl text-left text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-[#D39858]/30 mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0 pr-1">
                <MapPin size={13} className="text-[#D39858] flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-[#EACEAA] text-[11px] sm:text-sm leading-none truncate">
                    {activeCluster.city}
                  </h4>
                  <p className="text-[8px] sm:text-[10px] text-[#D39858] mt-0.5 truncate">{activeCluster.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[9px] sm:text-[11px] font-extrabold bg-[#D39858] text-[#34150F] px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full">
                  {activeCluster.count}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectCity(null)}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close popup"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            <p className="hidden sm:block text-[11px] text-[#EACEAA]/80 mb-1.5 font-medium">Landmark Installations:</p>
            <div className="space-y-1 max-h-16 sm:max-h-36 overflow-y-auto pr-0.5">
              {activeCluster.sampleProjects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject && onSelectProject(p.id)}
                  className="flex items-center gap-1.5 p-1 rounded-lg bg-[#34150F]/70 hover:bg-[#85431E]/60 cursor-pointer transition-colors border border-white/5"
                >
                  <img
                    src={
                      p.coverImage ||
                      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=100&auto=format&fit=crop"
                    }
                    alt={p.name}
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#FDFDF4] truncate text-[9.5px] sm:text-[11px]">{p.name}</p>
                    <p className="text-[8px] sm:text-[9px] text-[#D39858] truncate">{p.clientName}</p>
                  </div>
                  <ChevronRight size={10} className="text-[#EACEAA]/50 flex-shrink-0" />
                </div>
              ))}
            </div>

            <div className="pt-1 sm:pt-2 mt-1 sm:mt-2 border-t border-[#D39858]/20 flex items-center justify-between">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${activeCluster.city}, ${activeCluster.state}, India`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[8.5px] sm:text-[11px] font-bold text-[#D39858] hover:underline"
              >
                <span>Google Maps</span>
                <ExternalLink size={9} />
              </a>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("portfolio-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[8.5px] sm:text-[10px] text-[#EACEAA]/80 hover:text-white font-semibold hover:underline"
              >
                View List ↓
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Map Legend ─── */}
      <div className="relative z-20 mt-3 pt-2.5 border-t border-[#D39858]/20 flex flex-wrap items-center justify-between gap-3 text-xs text-[#EACEAA]/80">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D39858] ring-2 ring-[#FFFFFF]" />
            <span>Major Hub (&gt;10 Projects)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#85431E] ring-1 ring-[#FFFFFF]" />
            <span>Commercial Project City</span>
          </div>
        </div>

        <p className="text-[11px] text-[#D39858] font-semibold">
          130+ Completed Installations • 25+ Metropolitan Hubs
        </p>
      </div>
    </div>
  );
}

export default IndiaMap;
