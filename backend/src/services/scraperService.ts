import prisma from "../prisma/client";
import { MountainProjectScraper } from "../scrapers/mountainProjectScraper";
import { ClimbingLocation } from "../types";

export class ScraperService {
  async runScraper(): Promise<ClimbingLocation[]> {
    const allLocations: ClimbingLocation[] = [];
    const mountainProjectScraper = new MountainProjectScraper();

    try {
      await mountainProjectScraper.initialize();
      const locations = await mountainProjectScraper.scrape();
      allLocations.push(...locations);

      for (const location of locations) {
        await prisma.climbingLocation.upsert({
          where: { name: location.name },
          update: {
            ...location,
            updatedAt: new Date(),
          },
          create: location,
        });
      }
    } catch (error) {
      console.error("Error running Mountain Project scraper:", error);
    } finally {
      await mountainProjectScraper.close();
    }
    return allLocations;
  }
}
