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

export const DEFAULT_SHOWCASE_PRODUCTS: Product[] = [];

export const HERO_SLIDES = DEFAULT_HERO_SLIDES;
export const UPCOMING_SLIDES = DEFAULT_UPCOMING_SLIDES;
export const SUPER_SAVER_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const VALUE_MONEY_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const BEST_SELLER_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const CUBICLE_HARDWARE_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;
export const LOCKER_HARDWARE_PRODUCTS = DEFAULT_SHOWCASE_PRODUCTS;

export const CATEGORY_OPTIONS = [
  { label: 'Cubicle Hardwares', slug: 'cubicle-hardwares' },
  { label: 'Shower Cubicle Hardwares', slug: 'shower-cubicle-hardwares' },
  { label: 'Exchnage Room Hardware', slug: 'exchnage-room-hardware' },
  { label: 'Locker Hardwares', slug: 'locker-hardwares' },
  { label: 'Urinal Hardwares', slug: 'urinal-hardwares' },
];

export const NAV_LINKS = ['By Category', 'Products', 'By Materials', 'Best Sellers', 'New Arrivals', 'Offers', 'B2B / Bulk'];

export const AESTHETIC_SECTION_1 = [
  {
    id: '1',
    title: 'Cubicle Hardwares',
    subtitle: 'SS 304 Restroom & Cubicle Partition Systems',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    link: '/category/cubicle-hardwares',
    slug: 'cubicle-hardwares',
  },
  {
    id: '2',
    title: 'Locker Hardwares',
    subtitle: 'Commercial Electronic & Digital Locker Systems',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    link: '/category/locker-hardwares',
    slug: 'locker-hardwares',
  },
  {
    id: '3',
    title: 'Urinal & Shower Hardwares',
    subtitle: 'Architectural Grade Partition Solutions',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    link: '/category/urinal-hardwares',
    slug: 'urinal-hardwares',
  }
];

export const CUBICLE_SECTION = [
  {
    id: 'cub-1',
    title: 'Cubicle Partition Hardware',
    subtitle: 'Heavy Duty Restroom Partition Kits',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    link: '/category/cubicle-hardwares',
    slug: 'cubicle-hardwares',
  },
  {
    id: 'cub-2',
    title: 'SS 304 Premium Cubicle Locks',
    subtitle: 'Grade 304 Stainless Steel Locks & Legs',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    link: '/category/cubicle-hardwares',
    slug: 'cubicle-hardwares',
  }
];

export const LOCKER_SECTION = [
  {
    id: 'lock-1',
    title: 'Digital Electronic Locker Locks',
    subtitle: 'Commercial Keypad & RFID Security',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    link: '/category/locker-hardwares',
    slug: 'locker-hardwares',
  },
  {
    id: 'lock-2',
    title: 'Locker Partition Hardware',
    subtitle: 'Commercial Locker Room Solutions',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80',
    link: '/category/locker-hardwares',
    slug: 'locker-hardwares',
  }
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    role: 'Procurement Manager, Acme Constructions',
    text: 'PRC Hardware fittings are durable, certified, and delivered right on schedule for our commercial sites.'
  },
  {
    id: 2,
    name: 'Priya Nair',
    role: 'Lead Architect, Studio Design Hub',
    text: 'Top-grade SS 304 glass patch fittings and door handles. Very impressed by the build quality and customer support.'
  }
];
