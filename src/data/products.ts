import { Product } from '../types';

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'hero-1',
    title: 'Architectural Hardware Excellence',
    subtitle: 'Precision-engineered glass fittings, handles, and commercial partition systems.',
    badgeText: 'Premium Collection',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    desktopImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    tabletImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    linkUrl: '/products',
    ctaText: 'Explore Collection'
  },
  {
    id: 'hero-2',
    title: 'SS 304 Grade Commercial Hardware',
    subtitle: 'Certified durability and corrosion resistance for modern commercial interiors.',
    badgeText: 'Commercial Grade',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80',
    desktopImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=80',
    tabletImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    linkUrl: '/products',
    ctaText: 'View Hardware'
  }
];

export const DEFAULT_UPCOMING_SLIDES = [
  {
    id: 'up-1',
    title: 'Next-Gen Smart Locker Series',
    sub: 'Coming Soon',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80',
    desktopImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    linkUrl: '/products'
  }
];

export const DEFAULT_SHOWCASE_PRODUCTS: Product[] = [
  {
    id: 'prc-101',
    name: 'Heavy Duty Hydraulic Glass Door Closer',
    sku: 'PRC-DC-01',
    slug: 'hydraulic-glass-door-closer',
    price: 3499,
    salePrice: 3499,
    regularPrice: 4299,
    originalPrice: 4299,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
    category: 'Glass Door Fittings',
    material: 'SS 304 Stainless Steel',
    shortDesc: 'Universal floor spring and concealed closer with adjustable speed valves.',
    description: 'Universal floor spring and concealed closer with adjustable speed valves.',
    isBestseller: true,
    isInOffer: true,
    tags: ['bestseller', 'saver', 'deal']
  },
  {
    id: 'prc-102',
    name: 'SS 304 Privacy Indicator Cubicle Lock',
    sku: 'PRC-CB-02',
    slug: 'privacy-indicator-cubicle-lock',
    price: 899,
    salePrice: 899,
    regularPrice: 1199,
    originalPrice: 1199,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=600&fit=crop',
    category: 'Cubicle Hardware',
    material: 'Satin Stainless Steel',
    shortDesc: 'Emergency release external slot with red/green occupancy indicator.',
    description: 'Emergency release external slot with red/green occupancy indicator.',
    isBestseller: true,
    isInOffer: true,
    tags: ['bestseller', 'saver', 'deal']
  },
  {
    id: 'prc-103',
    name: 'Digital RFID Keypad Locker Lock',
    sku: 'PRC-LK-03',
    slug: 'digital-rfid-keypad-locker-lock',
    price: 2499,
    salePrice: 2499,
    regularPrice: 3299,
    originalPrice: 3299,
    discount: 24,
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=600&fit=crop',
    category: 'Locker Hardware',
    material: 'Zinc Alloy + ABS',
    shortDesc: 'Master password and RFID card support with emergency battery backup.',
    description: 'Master password and RFID card support with emergency battery backup.',
    isBestseller: true,
    isInOffer: true,
    tags: ['bestseller', 'saver']
  },
  {
    id: 'prc-104',
    name: 'Architectural Stainless Steel H-Handle (450mm)',
    sku: 'PRC-HN-04',
    slug: 'architectural-stainless-steel-h-handle',
    price: 1899,
    salePrice: 1899,
    regularPrice: 2399,
    originalPrice: 2399,
    discount: 21,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop',
    category: 'Door Handles',
    material: 'SS 304 Grade',
    shortDesc: 'Back-to-back glass and timber door pull handle with satin finish.',
    description: 'Back-to-back glass and timber door pull handle with satin finish.',
    isBestseller: true,
    isInOffer: false,
    tags: ['bestseller']
  }
];

export const HERO_SLIDES = DEFAULT_HERO_SLIDES;
export const UPCOMING_SLIDES = DEFAULT_UPCOMING_SLIDES;
export const SUPER_SAVER_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const VALUE_MONEY_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const BEST_SELLER_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const CUBICLE_HARDWARE_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const LOCKER_HARDWARE_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const CATEGORY_OPTIONS: any[] = [];
export const NAV_LINKS = ['Home', 'By Category', 'Products', 'By Materials', 'Offers', 'New Arrivals', 'Best Sellers', 'B2B / Bulk'];
export const AESTHETIC_SECTION_1 = [{ id: '1', title: 'Glass Door Fittings', subtitle: 'Satin & Polished SS 304', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', link: '/category/glass-fittings' }, { id: '2', title: 'Toilet Cubicle Hardware', subtitle: 'Restroom Hardware Kits', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', link: '/category/cubicles-hardware' }, { id: '3', title: 'Electronic Locker Locks', subtitle: 'Keypad & RFID Locks', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80', link: '/category/locker-hardware' }];
export const CUBICLE_SECTION = [{ id: 'cub-1', title: 'Nylon Series Cubicle Hardware', subtitle: 'Heavy Duty Restroom Partition Kits', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', link: '/category/cubicles-hardware' }, { id: 'cub-2', title: 'SS 304 Premium Cubicle Hardware', subtitle: 'Grade 304 Stainless Steel Locks & Legs', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', link: '/category/cubicles-hardware' }];
export const LOCKER_SECTION = [{ id: 'lock-1', title: 'Digital Electronic Keypad Locker Lock', subtitle: 'RFID & Password Security', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80', link: '/category/locker-hardware' }, { id: 'lock-2', title: 'Mechanical Number Combination Lock', subtitle: 'Keyless Commercial Lockers', image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80', link: '/category/locker-hardware' }];
export const TESTIMONIALS = [{ id: 1, name: 'Rahul Sharma', role: 'Procurement Manager, Acme Constructions', text: 'PRC Hardware fittings are durable, certified, and delivered right on schedule for our commercial sites.' }, { id: 2, name: 'Priya Nair', role: 'Lead Architect, Studio Design Hub', text: 'Top-grade SS 304 glass patch fittings and door handles. Very impressed by the build quality and customer support.' }];

