import { Response, Request } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { GeoService } from "../../services/geoService";
import {
  LocationsQueryRequest,
  NearbyLocationsRequest,
  BoundsLocationsQueryRequest,
  LocationsResponse,
  NearbyLocationsResponse,
  ClusteredLocationsResponse,
  LocationCluster,
  PaginationResponse,
  APIResponse,
} from "../../types/api";
import { ClimbingType } from "../../types";
import asyncHandler from "express-async-handler";
import { CustomBadRequestError } from "../../errors/customErrors";

const geoService = new GeoService();

const parseQueryParams = <T>(req: Request): T => {
  const result: any = {};

  if (req.query.page) {
    result.page = parseInt(req.query.page as string);
  }

  if (req.query.pageSize) {
    result.pageSize = parseInt(req.query.pageSize as string);
  }

  if (req.query.types) {
    const typeArray = (req.query.types as string).split(",");
    result.types = typeArray.filter((type) =>
      Object.values(ClimbingType).includes(type as ClimbingType)
    ) as ClimbingType[];
  }

  if (req.query.difficulty) {
    result.difficulty = req.query.difficulty as string;
  }

  // Process search term
  if (req.query.searchTerm) {
    result.searchTerm = req.query.searchTerm as string;
  }

  // Process geo parameters
  if (req.query.latitude) {
    result.latitude = parseFloat(req.query.latitude as string);
  }

  if (req.query.longitude) {
    result.longitude = parseFloat(req.query.longitude as string);
  }

  if (req.query.radius) {
    result.radius = parseFloat(req.query.radius as string);
  }

  // Process bounds
  if (req.query.north) {
    result.north = parseFloat(req.query.north as string);
  }

  if (req.query.south) {
    result.south = parseFloat(req.query.south as string);
  }

  if (req.query.east) {
    result.east = parseFloat(req.query.east as string);
  }

  if (req.query.west) {
    result.west = parseFloat(req.query.west as string);
  }

  if (req.query.zoom) {
    result.zoom = parseInt(req.query.zoom as string);
  }

  return result as T;
};

const createPaginationResponse = (
  currentPage: number,
  pageSize: number,
  totalItems: number
): PaginationResponse => {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
};

export const getLocations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const params: LocationsQueryRequest = parseQueryParams(req);

    const page = params.page || 1;
    const pageSize = params.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ClimbingLocationWhereInput = {};

    if (params.types && params.types.length > 0) {
      where.type = {
        in: params.types,
      };
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty;
    }

    if (params.searchTerm) {
      where.OR = [
        { name: { contains: params.searchTerm, mode: "insensitive" } },
        { description: { contains: params.searchTerm, mode: "insensitive" } },
      ];
    }

    const totalItems = await prisma.climbingLocation.count({ where });

    const locationsFromDb = await prisma.climbingLocation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
    });

    const locations = locationsFromDb.map((location) => ({
      ...location,
      type: location.type as ClimbingType,
      difficulty: location.difficulty || "",
      // Convert null values to undefined for optional fields
      address: location.address || undefined,
      description: location.description || undefined,
      website: location.website || undefined,
      imageUrl: location.imageUrl || undefined,
    }));

    const response: APIResponse<LocationsResponse> = {
      success: true,
      data: {
        locations,
        pagination: createPaginationResponse(page, pageSize, totalItems),
      },
      timestamp: Date.now(),
    };

    res.json(response);
  }
);

export const getNearbyLocations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const params: NearbyLocationsRequest = parseQueryParams(req);

    if (params.latitude === undefined || params.longitude === undefined) {
      throw new CustomBadRequestError("Latitude and Longitude are required");
    }

    const radius = params.radius || 50;
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;

    const offset = (page - 1) * pageSize;

    const locations = await geoService.findLocationsNearby(
      params.latitude,
      params.longitude,
      params.radius,
      {
        types: params.types,
        difficulty: params.difficulty,
        limit: pageSize,
        offset,
      }
    );

    const totalQuery = await geoService.countLocationsNearby(
      params.latitude,
      params.longitude,
      radius,
      {
        types: params.types,
        difficulty: params.difficulty,
      }
    );

    const totalItems = totalQuery[0]?.count || 0;

    const response: APIResponse<NearbyLocationsResponse> = {
      success: true,
      data: {
        locations,
        pagination: createPaginationResponse(page, pageSize, totalItems),
      },
      timestamp: Date.now(),
    };

    res.json(response);
  }
);

export const getLocationClusters = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const params: BoundsLocationsQueryRequest = parseQueryParams(req);

    if (
      params.north === undefined ||
      params.south === undefined ||
      params.east === undefined ||
      params.west === undefined
    ) {
      throw new CustomBadRequestError("Map bounds (NESW) are required");
    }

    const zoom = params.zoom || 10;

    const clusters = await geoService.getLocationClusters(
      {
        north: params.north,
        south: params.south,
        east: params.east,
        west: params.west,
      },
      zoom,
      {
        types: params.types,
        difficulty: params.difficulty,
      }
    );

    const formattedClusters: LocationCluster[] = clusters.map((cluster) => ({
      clusterId: cluster.cluster_id,
      pointCount: cluster.point_count,
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      locations: cluster.locations,
    }));

    const totalLocations = formattedClusters.reduce(
      (sum, cluster) => sum + cluster.pointCount,
      0
    );

    const response: APIResponse<ClusteredLocationsResponse> = {
      success: true,
      data: {
        clusters: formattedClusters,
        totalLocations,
      },
      timestamp: Date.now(),
    };

    res.json(response);
  }
);
