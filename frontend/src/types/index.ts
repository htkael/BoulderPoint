export enum ClimbingType {
    BOULDER = "BOULDER",
    GYM = 'GYM'
}

export interface GeoPoint {
    latitude: number;
    longitude: number
}

export interface ClimbingLocation {
    id: string;
    name: string;
    type: ClimbingType;
    difficulty: string;
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
    website?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date
}

export interface GetLocationsRequest {
    latitude?: number;
    longitude?: number;
    radius?: number;
    types?: ClimbingType[]
}

export interface GetLocationsResponse {
    locations: ClimbingLocation[];
    total: number
}

export interface LocationState {
    items: ClimbingLocation[];
    loading:'idle' | 'pending' | 'succeeded' | "failed";
    error: string | null;
    filters: LocationFilters
}

export interface LocationFilters {
    types: ClimbingType[];
    difficulty: string;
    searchRadius: number;
    searchQuery: string
}

export interface AppState {
    locations: LocationState
}