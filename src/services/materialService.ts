import { fetchApi } from './api';
import { Material } from '../types';

const MATERIALS_CACHE_KEY = 'prc_storefront_active_materials';

export const materialService = {
  /**
   * Fetch active materials from DB for the storefront navbar and product filtering
   */
  getActiveMaterials: async (): Promise<Material[]> => {
    // 1. Try local cache first for zero-latency instant render
    let cached: Material[] = [];
    try {
      const stored = localStorage.getItem(MATERIALS_CACHE_KEY);
      if (stored) cached = JSON.parse(stored);
    } catch {}

    try {
      const res = await fetchApi<any>('/materials?active=true');
      if (res && res.success && Array.isArray(res.data)) {
        const liveMaterials: Material[] = res.data;
        try {
          localStorage.setItem(MATERIALS_CACHE_KEY, JSON.stringify(liveMaterials));
        } catch {}
        return liveMaterials;
      }
    } catch (err) {
      console.warn('[materialService] Network fetch notice:', err);
    }

    if (cached.length > 0) return cached;

    // Fallback initial 4 defaults if network and cache unavailable
    return [
      {
        id: 'mat-001',
        name: '304 Grade Stainless Steel',
        slug: '304-grade-stainless-steel',
        shortName: 'SS 304',
        gradeBadge: 'Architectural Grade',
        description: 'Engineered with 18% Chromium and 8% Nickel composition for outstanding tensile strength.',
        tagline: 'Architectural Grade Stainless Steel',
        specs: ['18/8 Austenitic Stainless Steel', 'High Corrosion Resistance', 'Satin & Brushed Finish Ready'],
        isActive: true,
        position: 1,
      },
      {
        id: 'mat-002',
        name: '316 Grade Stainless Steel',
        slug: '316-grade-stainless-steel',
        shortName: 'SS 316',
        gradeBadge: 'Marine Grade',
        description: 'Enhanced with 2-3% Molybdenum for supreme chloride and saline pitting immunity.',
        tagline: 'Marine Grade Corrosion-Proof Steel',
        specs: ['2-3% Molybdenum Alloy', 'Marine & Chloride Immune', 'Extreme Tensile Toughness'],
        isActive: true,
        position: 2,
      },
      {
        id: 'mat-003',
        name: 'Architectural Aluminium',
        slug: 'architectural-aluminium',
        shortName: 'Aluminium',
        gradeBadge: 'Lightweight High-Strength',
        description: 'High-grade 6063-T6 extruded architectural aluminium delivering maximum rigidity.',
        tagline: 'Precision Extruded Structural Alloys',
        specs: ['Grade 6063-T6 Alloy', 'Anodized & Powder-Coated', 'Ultra-Smooth Sliding Glide'],
        isActive: true,
        position: 3,
      },
      {
        id: 'mat-004',
        name: 'Nylon Polyamide 6',
        slug: 'nylon-polyamide-6',
        shortName: 'Polyamide 6',
        gradeBadge: 'High-Impact Polymer',
        description: 'High-impact engineered thermoplastic polymer designed for self-lubricating applications.',
        tagline: 'Engineered High-Durability Polymer',
        specs: ['Virgin Polyamide 6 Resin', 'High Impact Shock Absorption', 'Self-Lubricating & Non-Marking'],
        isActive: true,
        position: 4,
      },
    ];
  },

  /**
   * Get single material details by slug or ID
   */
  getMaterialBySlug: async (slug: string): Promise<Material | null> => {
    try {
      const res = await fetchApi<any>(`/materials/${encodeURIComponent(slug)}`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch {}

    const all = await materialService.getActiveMaterials();
    return all.find((m) => m.slug.toLowerCase() === slug.toLowerCase() || m.id === slug) || null;
  },
};
