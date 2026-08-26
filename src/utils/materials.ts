import { Product } from "../types";

export interface MaterialMeta {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  gradeBadge: string;
  iconName: "Shield" | "Anchor" | "Layers" | "Box";
  tagline: string;
  description: string;
  specs: string[];
}

export const MATERIAL_REGISTRY: MaterialMeta[] = [
  {
    id: "304 Grade Steel",
    slug: "304-grade-steel",
    name: "304 Grade Stainless Steel",
    shortName: "SS 304",
    gradeBadge: "Architectural Grade",
    iconName: "Shield",
    tagline: "Architectural Grade Stainless Steel",
    description:
      "Engineered with 18% Chromium and 8% Nickel composition for outstanding tensile strength, oxidation resistance, and hygienic durability in commercial restrooms, office cubicles, and luxury interior fittings.",
    specs: ["18/8 Austenitic Stainless Steel", "High Corrosion Resistance", "Satin & Brushed Finish Ready", "IS / ASTM A240 Certified"],
  },
  {
    id: "316 Grade Steel",
    slug: "316-grade-steel",
    name: "316 Grade Stainless Steel",
    shortName: "SS 316",
    gradeBadge: "Marine Grade",
    iconName: "Anchor",
    tagline: "Marine Grade Corrosion-Proof Steel",
    description:
      "Enhanced with 2-3% Molybdenum for supreme chloride and saline pitting immunity. The ultimate specification for coastal infrastructure, swimming pool cubicles, chemical laboratories, and heavy-traffic industrial environments.",
    specs: ["2-3% Molybdenum Alloy", "Marine & Chloride Immune", "Extreme Tensile Toughness", "Zero-Rust Lifetime Guarantee"],
  },
  {
    id: "Aluminium",
    slug: "aluminium",
    name: "Architectural Aluminium",
    shortName: "Aluminium",
    gradeBadge: "Lightweight High-Strength",
    iconName: "Layers",
    tagline: "Precision Extruded Structural Alloys",
    description:
      "High-grade 6063-T6 extruded architectural aluminium delivering maximum rigidity with featherweight efficiency. Ideal for smooth-glide sliding door track assemblies, frame channels, and partition clamps.",
    specs: ["Grade 6063-T6 Alloy", "Anodized & Powder-Coated", "Ultra-Smooth Sliding Glide", "100% Recyclable & Non-Magnetic"],
  },
  {
    id: "Nylon Polyamide 6",
    slug: "nylon-polyamide-6",
    name: "Nylon Polyamide 6",
    shortName: "Polyamide 6",
    gradeBadge: "High-Impact Polymer",
    iconName: "Box",
    tagline: "Engineered High-Durability Polymer",
    description:
      "High-impact engineered thermoplastic polymer designed for self-lubricating, vibration-absorbing, and electrical-insulating applications including electronic cam locks, magnetic door catches, and heavy-duty partition buffers.",
    specs: ["Virgin Polyamide 6 Resin", "High Impact Shock Absorption", "Self-Lubricating & Non-Marking", "Anti-Static & Chemical Safe"],
  },
];

export function resolveMaterialBySlug(slugOrId?: string): MaterialMeta {
  if (!slugOrId) return MATERIAL_REGISTRY[0];
  const s = slugOrId.toLowerCase().trim();

  // Try dynamic cache first
  try {
    const stored = localStorage.getItem("prc_storefront_active_materials");
    if (stored) {
      const liveList: any[] = JSON.parse(stored);
      const match = liveList.find(
        (m) =>
          m.slug.toLowerCase() === s ||
          m.id.toLowerCase() === s ||
          (m.name && m.name.toLowerCase() === s)
      );
      if (match) {
        return {
          id: match.id || match.name,
          slug: match.slug,
          name: match.name,
          shortName: match.shortName || match.name,
          gradeBadge: match.gradeBadge || "Premium Grade",
          iconName: (match.iconName as any) || "Shield",
          tagline: match.tagline || `${match.name} Hardware`,
          description: match.description || `${match.name} architectural hardware solutions.`,
          specs: Array.isArray(match.specs) ? match.specs : [],
        };
      }
    }
  } catch {}

  // Match by exact slug in static registry
  const bySlug = MATERIAL_REGISTRY.find((m) => m.slug === s || m.id.toLowerCase() === s);
  if (bySlug) return bySlug;

  // Match by id substring
  if (s.includes("304") || s.includes("ss304")) return MATERIAL_REGISTRY[0];
  if (s.includes("316") || s.includes("marine")) return MATERIAL_REGISTRY[1];
  if (s.includes("alum")) return MATERIAL_REGISTRY[2];
  if (s.includes("nylon") || s.includes("polyamide") || s.includes("polymer")) return MATERIAL_REGISTRY[3];

  return MATERIAL_REGISTRY[0];
}

export function isProductOfMaterial(product: Product, targetMaterialIdOrSlug: string): boolean {
  if (!targetMaterialIdOrSlug) return true;

  const target = targetMaterialIdOrSlug.toLowerCase().trim();

  // Direct foreign key matching
  if (product.materialId && (product.materialId.toLowerCase() === target || product.materialId === targetMaterialIdOrSlug)) {
    return true;
  }
  if (product.materialObj && (product.materialObj.slug.toLowerCase() === target || product.materialObj.id.toLowerCase() === target)) {
    return true;
  }

  const meta = resolveMaterialBySlug(targetMaterialIdOrSlug);
  const targetId = meta.id.toLowerCase();
  const matField = (product.material || "").toLowerCase();
  const nameField = (product.name || "").toLowerCase();
  const descField = (product.description || "").toLowerCase();
  const specMat = typeof (product as any).specifications?.material === "string"
    ? (product as any).specifications.material.toLowerCase()
    : "";

  // Exact name or slug matching in product metadata
  if (matField.includes(meta.name.toLowerCase()) || matField.includes(meta.slug)) {
    return true;
  }

  const combined = `${matField} ${specMat} ${nameField} ${descField}`;

  if (targetId.includes("304") || target.includes("304")) {
    return (
      combined.includes("304") ||
      (combined.includes("stainless") && !combined.includes("316")) ||
      (matField.includes("steel") && !combined.includes("316") && !combined.includes("nylon"))
    );
  }

  if (targetId.includes("316") || target.includes("316")) {
    return (
      combined.includes("316") ||
      combined.includes("marine grade") ||
      combined.includes("marine-grade")
    );
  }

  if (targetId.includes("alum") || target.includes("alum")) {
    return combined.includes("alum") || combined.includes("extrusion") || combined.includes("track");
  }

  if (targetId.includes("nylon") || targetId.includes("polyamide") || target.includes("nylon")) {
    return (
      combined.includes("nylon") ||
      combined.includes("polyamide") ||
      combined.includes("polymer") ||
      combined.includes("cam lock") ||
      combined.includes("magnetic catch") ||
      combined.includes("digital lock") ||
      combined.includes("keypad")
    );
  }

  return combined.includes(meta.slug) || combined.includes(targetId) || combined.includes(meta.name.toLowerCase());
}
