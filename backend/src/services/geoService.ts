import { PrismaClient, Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ClimbingLocation, ClimbingType } from "../types/index";

interface GeoQueryOptions {
  types?: ClimbingType[];
  difficulty?: string;
  limit?: number;
  offset?: number;
}

interface LocationWithDistance extends ClimbingLocation {
  distance: number;
}

export class GeoService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findLocationsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    options: GeoQueryOptions = {}
  ): Promise<LocationWithDistance[]> {
    const radiusMeters = radiusKm * 1000;

    const filters: Prisma.Sql[] = [];

    // Type filter
    if (options.types && options.types.length > 0) {
      filters.push(
        Prisma.sql`AND "type" IN (${Prisma.join(
          options.types.map((t) => Prisma.sql`${t}`),
          ", "
        )})`
      );
    }

    // Difficulty filters
    if (options.difficulty) {
      filters.push(Prisma.sql`AND "difficulty" = ${options.difficulty}`);
    }

    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const result = await this.prisma.$queryRaw<LocationWithDistance[]>`
      SELECT id, name, type, difficulty, latitude, longitude, 
             address, description, website, "imageUrl", "createdAt", "updatedAt",
             ST_Distance(
               "coordinates",
               ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
               true
             ) as distance
      FROM "ClimbingLocation"
      WHERE ST_DWithin(
        "coordinates",
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        ${radiusMeters}
      )
      ${Prisma.join(filters, " ")}
      ORDER BY distance
      LIMIT ${limit} OFFSET ${offset}
    `;

    return result;
  }

  async getLocationClusters(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    zoom: number,
    options: GeoQueryOptions = {}
  ): Promise<any[]> {
    const clusterMeters = Math.max(5000 / Math.pow(1.5, zoom - 3), 100);

    const filters: Prisma.Sql[] = [];

    if (options.types && options.types.length > 0) {
      filters.push(
        Prisma.sql`AND "type" IN (${Prisma.join(
          options.types.map((t) => Prisma.sql`${t}`),
          ", "
        )})`
      );
    }

    const result = await this.prisma.$queryRaw<any[]>`
    WITH bounds AS (
      SELECT ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${
      bounds.north
    }, 4326) as geom
    ),
    filtered_locations AS (
      SELECT * 
      FROM "ClimbingLocation"
      WHERE ST_Intersects("coordinates", (SELECT geom FROM bounds))
      ${Prisma.join(filters, " ")}
    ),
    clustered AS (
      SELECT 
        ST_ClusterDBSCAN("coordinates", ${clusterMeters}, 1) OVER () as cluster_id,
        *
      FROM filtered_locations
    ),
    clusters AS (
      SELECT 
        cluster_id,
        COUNT(*) as point_count,
        ST_Centroid(ST_Collect("coordinates")) as centroid,
        json_agg(json_build_object(
          'id', id,
          'name', name,
          'type', type,
          'difficulty', difficulty,
          'latitude', latitude,
          'longitude', longitude
        )) as locations
      FROM clustered
      GROUP BY cluster_id
    )
    SELECT 
      cluster_id,
      point_count,
      ST_X(centroid) as longitude,
      ST_Y(centroid) as latitude,
      locations
    FROM clusters
    ORDER BY point_count DESC;
  `;

    return result;
  }

  async countLocationsNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
    options: Omit<GeoQueryOptions, "limit" | "offset"> = {}
  ): Promise<{ count: number }[]> {
    // Convert km to meters for PostGIS
    const radiusMeters = radiusKm * 1000;

    // Build filters
    const filters: Prisma.Sql[] = [];

    // Type filter
    if (options.types && options.types.length > 0) {
      filters.push(
        Prisma.sql`AND "type" IN (${Prisma.join(
          options.types.map((t) => Prisma.sql`${t}`),
          ", "
        )})`
      );
    }

    // Difficulty filters
    if (options.difficulty) {
      filters.push(Prisma.sql`AND "difficulty" = ${options.difficulty}`);
    }

    // Use raw query to count locations
    const result = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM "ClimbingLocation"
      WHERE ST_DWithin(
        "coordinates",
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        ${radiusMeters}
      )
      ${Prisma.join(filters, " ")}
    `;

    return result;
  }
}
