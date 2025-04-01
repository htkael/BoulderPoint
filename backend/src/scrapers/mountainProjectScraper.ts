import { BaseScraper } from "./baseScraper";
import { ClimbingLocation, ClimbingType } from "../types";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "node:path";

export class MountainProjectScraper extends BaseScraper {
  constructor() {
    super("https://www.mountainproject.com");
  }

  async scrape(): Promise<ClimbingLocation[]> {
    if (!this.page) {
      throw new Error("Scraper not initialized");
    }

    const locations: ClimbingLocation[] = [];

    try {
      await this.page.goto(
        `${this.baseUrl}/route-finder?type=boulder&diffMinrock=800&diffMinboulder=20000&diffMinaid=70000&diffMinice=30000&diffMinmixed=50000&diffMaxrock=12400&diffMaxboulder=21700&diffMaxaid=75260&diffMaxice=38500&diffMaxmixed=65050&is_trad_climb=1&is_sport_climb=1&is_top_rope=1&stars=0&pitches=0&selectedIds=0`
      );

      await this.page.waitForSelector(".route-table");

      const totalPages = await this.page.evaluate((): number => {
        const pagination = document.querySelector(".pagination");
        const paginationElement = pagination?.querySelector(":nth-child(3)");
        const paginationText = paginationElement?.textContent;

        if (paginationText) {
          console.log(`Pagination text: ${paginationText}`);
          const match = paginationText.match(/\d+\s+of\s+(\d+)/);
          return match ? parseInt(match[1]) : 1;
        }
        return 1;
      });
      console.log(`Found ${totalPages} total pages to scrape`);

      let pageNum = 1;
      while (pageNum <= totalPages) {
        console.log(`Processing page ${pageNum} of ${totalPages}`);

        await this.page.waitForSelector(".table.route-table", {
          timeout: 30000,
        });

        const boulderRoutesOnPage = await this.page.evaluate(() => {
          // Only select rows that actually contain data
          const rows = Array.from(
            document.querySelectorAll(
              ".table.route-table.hidden-xs-down tr:not(.screen-reader-only)"
            )
          ).filter((row) => row.querySelector("td:first-child a"));

          return rows.map((row) => {
            const nameElement = row.querySelector("td:first-child a");
            const name = nameElement ? nameElement.textContent?.trim() : "N/A";
            const routeLink = nameElement
              ? (nameElement as HTMLAnchorElement).href
              : "";

            const locationElement = row.querySelector(
              "td:nth-child(2) .text-warm"
            );

            // Get all links in the location path
            const locationLinks = locationElement
              ? Array.from(locationElement.querySelectorAll("a"))
              : [];

            // Get the last link (which should be the boulder link)
            const lastLink =
              locationLinks.length > 0
                ? locationLinks[locationLinks.length - 1]
                : null;

            const boulderLink = lastLink ? lastLink.href : "N/A";
            const boulderName = lastLink ? lastLink.textContent?.trim() : "N/A";

            // Get grade
            const gradeElement = row.querySelector(
              "td:last-child .rateYDS, td:last-child .rateFont"
            );
            const grade = gradeElement
              ? gradeElement.textContent?.trim()
              : "N/A";

            return {
              name,
              routeLink,
              grade,
              boulder: {
                name: boulderName,
                link: boulderLink,
              },
            };
          });
        });

        if (boulderRoutesOnPage.length > 0) {
          console.log(`First Route: ${JSON.stringify(boulderRoutesOnPage[0])}`);
        }

        for (const boulder of boulderRoutesOnPage) {
          await this.randomDelay(500, 2000);

          await this.page.goto(boulder.boulder.link);
          await this.page.waitForSelector(".description-details");

          const coordinates = await this.page.evaluate(
            (): { lat: number; lng: number } | null => {
              const gpsRow = Array.from(
                document.querySelectorAll(".description-details tr")
              ).find((row) =>
                row.querySelector("td")?.textContent?.includes("GPS:")
              );

              if (!gpsRow) return null;

              const coordinatesCell = gpsRow.querySelectorAll("td")[1];

              if (!coordinatesCell) return null;

              const coordinatesText = coordinatesCell.textContent?.trim();

              if (!coordinatesText) return null;

              const match = coordinatesText.match(
                /(-?\d+\.\d+),\s*(-?\d+\.\d+)/
              );

              if (!match) return null;

              return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
              };
            }
          );

          if (coordinates && boulder.name && boulder.grade) {
            let climbingType: ClimbingType = ClimbingType.BOULDER;
            const difficulty = boulder.grade;

            const location: ClimbingLocation = {
              id: uuidv4(),
              name: boulder.name,
              type: climbingType,
              difficulty,
              latitude: coordinates.lat,
              longitude: coordinates.lng,
              website: boulder.routeLink,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            locations.push(location);

            const progressFilePath = path.join(
              __dirname,
              `files/boulder-routes-page-${pageNum}.json`
            );
            fs.writeFileSync(
              progressFilePath,
              JSON.stringify(locations, null, 2)
            );
          }
        }
        if (pageNum < totalPages) {
          const nextPageUrl = `https://www.mountainproject.com/route-finder?diffMaxaid=75260&diffMaxboulder=21700&diffMaxice=38500&diffMaxmixed=65050&diffMaxrock=12400&diffMinaid=70000&diffMinboulder=20000&diffMinice=30000&diffMinmixed=50000&diffMinrock=800&is_sport_climb=1&is_top_rope=1&is_trad_climb=1&pitches=0&selectedIds=0&stars=0&type=boulder&page=${
            pageNum + 1
          }`;
          await this.page.goto(nextPageUrl, { waitUntil: "networkidle2" });

          pageNum++;
        } else {
          console.log("Reached the last page or maximum page limit");
          break;
        }
      }
    } catch (error) {
      console.error(`Error during scraping: ${error}`);
    }

    const filePath = path.join(__dirname, "files/boulder-routes.json");
    fs.writeFileSync(filePath, JSON.stringify(locations, null, 2));

    return locations;
  }
}
