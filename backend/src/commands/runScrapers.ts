import { ScraperService } from "../services/scraperService";

async function main() {
  console.log("Starting scrapers");

  const scraperService = new ScraperService();

  try {
    const locations = await scraperService.runScraper();
    console.log(`Successfully scraped ${locations.length} locations`);
  } catch (err) {
    console.error("Error running scrapers", err);
  }

  console.log("Scraping completed");
  process.exit(0);
}

main();
