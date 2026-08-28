export interface Project {
  id: string;
  name: string;
  clientName: string;
  location?: string | null;
  city: string;
  state: string;
  region?: string | null;
  isPanIndia: boolean;
  category: string;
  description?: string | null;
  completionYear?: string | null;
  productsUsed: string[];
  images: string[];
  videoUrl?: string | null;
  isFeatured: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLocationCluster {
  city: string;
  state: string;
  count: number;
  lat: number;
  lng: number;
  sampleProjects: {
    id: string;
    name: string;
    clientName: string;
    category: string;
    coverImage: string;
  }[];
}

export interface ProjectLocationsSummary {
  totalProjects: number;
  totalCities: number;
  panIndiaCount: number;
  clusters: ProjectLocationCluster[];
  panIndiaProjects: {
    id: string;
    name: string;
    clientName: string;
    category: string;
    coverImage: string;
  }[];
}

export interface ProjectCategoryCount {
  category: string;
  count: number;
}
