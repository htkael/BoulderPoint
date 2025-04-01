-- Add a Point column using PostGIS
ALTER TABLE "ClimbingLocation" ADD COLUMN IF NOT EXISTS "coordinates" geometry(Point, 4326);

-- Update the point column based on latitude and longitude
UPDATE "ClimbingLocation" SET "coordinates" = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

-- Create a spatial index
CREATE INDEX IF NOT EXISTS idx_climbing_location_coordinates ON "ClimbingLocation" USING GIST ("coordinates");

-- Create a trigger to update the coordinates when lat/lng change
CREATE OR REPLACE FUNCTION update_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  NEW."coordinates" := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_climbing_location_coordinates ON "ClimbingLocation";
CREATE TRIGGER update_climbing_location_coordinates
BEFORE INSERT OR UPDATE ON "ClimbingLocation"
FOR EACH ROW EXECUTE FUNCTION update_coordinates();