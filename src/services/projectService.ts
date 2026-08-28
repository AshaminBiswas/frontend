import { fetchApi } from "./api";
import {
  Project,
  ProjectLocationsSummary,
  ProjectCategoryCount,
} from "../types/project";
import {
  STATIC_PROJECTS,
  getStaticMapLocations,
} from "../data/projectsData";

export interface GetProjectsParams {
  search?: string;
  category?: string;
  city?: string;
  state?: string;
  region?: string;
  isPanIndia?: string;
  isFeatured?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface GetProjectsResponse {
  projects: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

function filterStaticProjects(params?: GetProjectsParams): GetProjectsResponse {
  let list = [...STATIC_PROJECTS];

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.productsUsed?.some((prod) => prod.toLowerCase().includes(q))
    );
  }

  if (params?.category && params.category !== "ALL") {
    list = list.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
  }

  if (params?.city && params.city !== "ALL") {
    if (params.city === "Pan India") {
      list = list.filter((p) => p.isPanIndia);
    } else {
      list = list.filter((p) => p.city?.toLowerCase() === params.city!.toLowerCase());
    }
  }

  if (params?.isPanIndia !== undefined) {
    const flag = params.isPanIndia === "true";
    list = list.filter((p) => p.isPanIndia === flag);
  }

  if (params?.isFeatured !== undefined) {
    const flag = params.isFeatured === "true";
    list = list.filter((p) => p.isFeatured === flag);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 150;
  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = list.slice(start, start + limit);

  return {
    projects: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export const projectService = {
  /**
   * Fetch active projects with filters, with resilient static fallback
   */
  async getProjects(params?: GetProjectsParams): Promise<GetProjectsResponse> {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.append("search", params.search);
      if (params?.category && params.category !== "ALL") qs.append("category", params.category);
      if (params?.city && params.city !== "ALL") qs.append("city", params.city);
      if (params?.state && params.state !== "ALL") qs.append("state", params.state);
      if (params?.region) qs.append("region", params.region);
      if (params?.isPanIndia !== undefined) qs.append("isPanIndia", params.isPanIndia);
      if (params?.isFeatured !== undefined) qs.append("isFeatured", params.isFeatured);
      if (params?.page) qs.append("page", String(params.page));
      if (params?.limit) qs.append("limit", String(params.limit));
      if (params?.sort) qs.append("sort", params.sort);

      const queryStr = qs.toString() ? `?${qs.toString()}` : "";
      const res = await fetchApi<GetProjectsResponse>(`/projects${queryStr}`);
      if (res.success && res.data && res.data.projects?.length > 0) {
        return res.data;
      }
    } catch {
      // Backend not yet deployed or returning 404, seamlessly use rich static dataset
    }
    return filterStaticProjects(params);
  },

  /**
   * Fetch single project detail by ID
   */
  async getProjectById(id: string): Promise<Project | null> {
    try {
      const res = await fetchApi<Project>(`/projects/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // fallback
    }
    return (
      STATIC_PROJECTS.find((p) => p.id === id || p.name.toLowerCase() === id.toLowerCase()) ||
      null
    );
  },

  /**
   * Fetch geographic clusters for the interactive India Map
   */
  async getMapLocations(): Promise<ProjectLocationsSummary> {
    try {
      const res = await fetchApi<ProjectLocationsSummary>("/projects/map/locations");
      if (res.success && res.data && res.data.clusters?.length > 0) {
        return res.data;
      }
    } catch {
      // Backend not yet deployed or returning 404, seamlessly use static map locations
    }
    return getStaticMapLocations();
  },

  /**
   * Fetch category breakdown with project counts
   */
  async getCategories(): Promise<ProjectCategoryCount[]> {
    try {
      const res = await fetchApi<ProjectCategoryCount[]>("/projects/categories");
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // fallback
    }

    const counts = new Map<string, number>();
    STATIC_PROJECTS.forEach((p) => {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  },
};

export default projectService;
