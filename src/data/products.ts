import { Product, Testimonial, HeroSlide, UpcomingSlide, AestheticBannerItem } from "../types";

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=700&fit=crop&auto=format",
    title: "Premium Cabinet Hardware",
    subtitle: "Elevate Every Space",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=700&fit=crop&auto=format",
    title: "Architectural Door Fittings",
    subtitle: "Crafted for Distinction",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&h=700&fit=crop&auto=format",
    title: "Modern Drawer Handles",
    subtitle: "Precision Meets Elegance",
  },
];

export const UPCOMING_SLIDES: UpcomingSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=900&h=360&fit=crop&auto=format",
    title: "New Collection — Spring 2025",
    sub: "Brushed Brass Handles & Knobs",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&h=360&fit=crop&auto=format",
    title: "Limited Edition — Matte Black Series",
    sub: "Available from June 1st",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=900&h=360&fit=crop&auto=format",
    title: "Smart Lock Integration",
    sub: "Coming Soon — Pre-register Now",
  },
];

export const AESTHETIC_SECTION_1: AestheticBannerItem[] = [
  {
    id: 1,
    title: "Warm Bronze",
    image: "https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=500&h=400&fit=crop&auto=format",
    color: "#D39858",
  },
  {
    id: 2,
    title: "Matte Black",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=400&fit=crop&auto=format",
    color: "#34150F",
  },
  {
    id: 3,
    title: "Satin Nickel",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop&auto=format",
    color: "#EACEAA",
  },
];

export const CUBICLE_SECTION: AestheticBannerItem[] = [
  {
    id: 1,
    title: "Office Cubicle",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=400&fit=crop&auto=format",
    color: "#85431E",
  },
  {
    id: 2,
    title: "Partition Systems",
    image: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=500&h=400&fit=crop&auto=format",
    color: "#D39858",
  },
  {
    id: 3,
    title: "Modular Panels",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&h=400&fit=crop&auto=format",
    color: "#34150F",
  },
];

export const LOCKER_SECTION: AestheticBannerItem[] = [
  {
    id: 1,
    title: "School Lockers",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&h=400&fit=crop&auto=format",
    color: "#34150F",
  },
  {
    id: 2,
    title: "Gym Storage",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400&fit=crop&auto=format",
    color: "#85431E",
  },
  {
    id: 3,
    title: "Office Lockers",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&h=400&fit=crop&auto=format",
    color: "#D39858",
  },
];

export const SUPER_SAVER_PRODUCTS: Product[] = [
  { id: 1, name: "Brass Cabinet Handle Set", price: 349, originalPrice: 699, discount: 50, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format", category: "Handles", material: "304 Grade Steel", description: "Premium solid brass cabinet handles with brushed satin finish. Resistant to corrosion and wear." },
  { id: 2, name: "Chrome Drawer Knob (Pack of 10)", price: 199, originalPrice: 450, discount: 56, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop&auto=format", category: "Knobs", material: "Aluminium", description: "High-grade polished chrome drawer knobs engineered for modern cabinetry." },
  { id: 3, name: "Heavy-Duty Door Hinge", price: 129, originalPrice: 290, discount: 55, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&auto=format", category: "Hinges", material: "316 Grade Steel", description: "Industrial precision ball-bearing hinges built for heavy architectural doors." },
  { id: 4, name: "Stainless Cupboard Lock", price: 249, originalPrice: 499, discount: 50, image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop&auto=format", category: "Locks", material: "304 Grade Steel", description: "Heavy-duty security lock for executive cupboards and filing systems." },
  { id: 5, name: "Antique Gold Pull Handle", price: 449, originalPrice: 899, discount: 50, image: "https://images.unsplash.com/photo-1556909048-f6d8e1e4b5e7?w=400&h=400&fit=crop&auto=format", category: "Handles", material: "Brass & Zinc Fittings", description: "Handcrafted antique gold finish pull handle designed for luxury furniture." },
];

export const VALUE_MONEY_PRODUCTS: Product[] = [
  { id: 6, name: "Zinc Cabinet Handle", price: 89, originalPrice: 150, discount: 40, image: "https://images.unsplash.com/photo-1556909048-f6d8e1e4b5e7?w=400&h=400&fit=crop&auto=format", category: "Handles", material: "Brass & Zinc Fittings", description: "Durable die-cast zinc alloy cabinet pull handle." },
  { id: 7, name: "Sliding Door Track Set", price: 599, originalPrice: 999, discount: 40, image: "https://images.unsplash.com/photo-1573753228543-88e6c4a5e888?w=400&h=400&fit=crop&auto=format", category: "Tracks", material: "Aluminium", description: "Smooth-glide extruded aluminum track mechanism for sliding doors." },
  { id: 8, name: "Magnetic Catch (Pack of 5)", price: 149, originalPrice: 249, discount: 40, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format", category: "Catches", material: "Nylon Polyamide 6", description: "Ultra-strong neodymium magnetic catches in durable nylon housing." },
  { id: 9, name: "Concealed Soft-Close Hinge Set", price: 299, originalPrice: 499, discount: 40, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop&auto=format", category: "Hinges", material: "304 Grade Steel", description: "Full overlay 110-degree hydraulic concealed hinges." },
  { id: 10, name: "Barrel Bolt Latch", price: 119, originalPrice: 199, discount: 40, image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop&auto=format", category: "Latches", material: "316 Grade Steel", description: "Solid marine-grade stainless steel safety barrel latch." },
];

export const BEST_SELLER_PRODUCTS: Product[] = [
  { id: 11, name: "Solid Brass Lever Handle", price: 799, originalPrice: 1299, discount: 38, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format", category: "Handles", material: "304 Grade Steel", description: "Ergonomic solid brass door lever set with keyway rosette." },
  { id: 12, name: "Antique Copper Ring Pull", price: 349, originalPrice: 599, discount: 42, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop&auto=format", category: "Pulls", material: "Brass & Zinc Fittings", description: "Vintage distressed copper ring pull handle for classic wardrobes." },
  { id: 13, name: "Heavy Soft-Close Cabinet Hinge", price: 499, originalPrice: 799, discount: 37, image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&auto=format", category: "Hinges", material: "316 Grade Steel", description: "Integrated hydraulic damper soft-close 3D adjustable hinge." },
  { id: 14, name: "Digital Touch Keypad Lock", price: 2499, originalPrice: 3999, discount: 37, image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=400&fit=crop&auto=format", category: "Locks", material: "Nylon Polyamide 6", description: "Biometric and PIN passcode smart lock system for commercial doors." },
  { id: 15, name: "Matte Black T-Bar Handle", price: 599, originalPrice: 950, discount: 36, image: "https://images.unsplash.com/photo-1556909048-f6d8e1e4b5e7?w=400&h=400&fit=crop&auto=format", category: "Handles", material: "Aluminium", description: "Minimalist architect-grade matte black T-bar cabinet pull." },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Arjun Mehta",
    role: "Interior Designer, Mumbai",
    rating: 5,
    message: "PRC Hardware has been my go-to supplier for premium handles and hinges. The quality is unmatched and delivery is always on time. My clients are always impressed with the finish.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Architect, Bengaluru",
    rating: 5,
    message: "Excellent product range and competitive pricing. The cubicle hardware collection is exactly what I needed for a large commercial project. Highly recommend PRC Hardware.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b37c?w=80&h=80&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Rakesh Gupta",
    role: "Furniture Manufacturer, Delhi",
    rating: 4,
    message: "Bulk ordering is seamless and the B2B support team is very responsive. The super saver deals save us a significant amount each month. Great partnership overall.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
  },
];

export const NAV_LINKS = ["By Category", "Products", "By Materials", "Best Sellers", "New Arrivals", "Offers", "B2B / Bulk"];

export const CATEGORY_OPTIONS = [
  { label: "Cubicles Hardware" },
  { label: "Locker Hardware" },
  { label: "Urinal Hardware" },
  { label: "Shower Room Hardware" },
  { label: "Exchange Room Hardware" },
];

export const PRODUCT_SUB_CATEGORIES = [
  { label: "Cabinet Handles" },
  { label: "Door Hinges & Pulls" },
  { label: "Drawer Knobs & Slides" },
  { label: "Smart Digital Locks" },
  { label: "Brass & Zinc Fittings" },
  { label: "Sliding Door Track Sets" },
];

export const MATERIAL_OPTIONS = [
  { label: "304 Grade Steel" },
  { label: "316 Grade Steel" },
  { label: "Aluminium" },
  { label: "Nylon Polyamide 6" },
];
