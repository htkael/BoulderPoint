export enum ClimbingType {
  BOULDER = "BOULDER",
  GYM = "GYM",
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
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
  updatedAt: Date;
}
