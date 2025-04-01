import { ClimbingLocation, ClimbingType } from "./index";

export interface PaginationRequest {
  page?: number;
  pageSize?: number;
}

export interface PaginationResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LocationsQueryRequest extends PaginationRequest {
  types?: ClimbingType[];
  difficulty?: string;
  searchTerm?: string;
}

export interface NearbyLocationsRequest extends LocationsQueryRequest {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface BoundsLocationsQueryRequest extends LocationsQueryRequest {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

export interface LocationsResponse {
  locations: ClimbingLocation[];
  pagination: PaginationResponse;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface LocationWithDistance extends ClimbingLocation {
  distance: number;
}

export interface NearbyLocationsResponse {
  locations: LocationWithDistance[];
  pagination: PaginationResponse;
}

export interface LocationCluster {
  clusterId: number;
  pointCount: number;
  latitude: number;
  longitude: number;
  locations: Partial<ClimbingLocation>[];
}

export interface ClusteredLocationsResponse {
  clusters: LocationCluster[];
  totalLocations: number;
}
