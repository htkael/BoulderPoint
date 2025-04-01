import prisma from "../prisma/client";
import { execSync } from "child_process";
import { ScraperService } from "../services/scraperService";

async function main() {
  try {
    // // Step 1: Run Prisma migration for the basic table structure
    // console.log("Running prisma migrations")
    // execSync('npx prisma migrate dev --name init --schema=./src/prisma/schema.prisma', { stdio: 'inherit' });

    // Step 2: Now run PostGIS setup separately after tables exist
    console.log("Setting up PostGIS extensions...");
    execSync("npm run prisma:postgis", { stdio: "inherit" });

    // Step 3: Run scrapers to seed data
    console.log("Running scrapers to seed data...");
    const scraperService = new ScraperService();
    const locations = await scraperService.runScraper();
    console.log(`Seeded ${locations.length} locations`);

    console.log("Database setup completed successfully");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
