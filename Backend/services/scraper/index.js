const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("node:path");

const getBoulders = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1440,
      height: 800,
    },
  });
  const page = await browser.newPage();

  // Set a higher timeout for navigation
  page.setDefaultNavigationTimeout(60000);

  // Go to the first page
  await page.goto(
    "https://www.mountainproject.com/route-finder?type=boulder&diffMinrock=800&diffMinboulder=20000&diffMinaid=70000&diffMinice=30000&diffMinmixed=50000&diffMaxrock=12400&diffMaxboulder=21700&diffMaxaid=75260&diffMaxice=38500&diffMaxmixed=65050&is_trad_climb=1&is_sport_climb=1&is_top_rope=1&stars=0&pitches=0&selectedIds=0"
  );

  let allBoulderRoutes = [];
  let pageNum = 1;
  let maxPages = 20; // Set a reasonable limit

  // Get the total number of pages
  const totalPages = await page.evaluate(() => {
    const pagination = document.querySelector(".pagination");
    const paginationText =
      pagination.querySelector(":nth-child(3)").textContent;
    if (paginationText) {
      console.log("Pagination text", paginationText);
      const match = paginationText.match(/\d+\s+of\s+(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }
    return 1;
  });

  console.log(`Found ${totalPages} total pages to scrape`);

  try {
    while (pageNum <= Math.min(totalPages, maxPages)) {
      console.log(`Processing page ${pageNum} of ${totalPages}...`);

      await page.waitForSelector(".table.route-table", { timeout: 30000 });

      const boulderRoutesOnPage = await page.evaluate(() => {
        // Only select rows that actually contain data
        const rows = Array.from(
          document.querySelectorAll(
            ".table.route-table.hidden-xs-down tr:not(.screen-reader-only)"
          )
        ).filter((row) => row.querySelector("td:first-child a"));

        return rows.map((row) => {
          const nameElement = row.querySelector("td:first-child a");
          const name = nameElement ? nameElement.textContent.trim() : "N/A";
          const routeLink = nameElement ? nameElement.href : "N/A";

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
          const boulderName = lastLink ? lastLink.textContent.trim() : "N/A";

          // Get grade
          const gradeElement = row.querySelector(
            "td:last-child .rateYDS, td:last-child .rateFont"
          );
          const grade = gradeElement ? gradeElement.textContent.trim() : "N/A";

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

      allBoulderRoutes = allBoulderRoutes.concat(boulderRoutesOnPage);
      console.log(
        `Found ${boulderRoutesOnPage.length} routes on page ${pageNum}`
      );

      // Save progress after each page
      const progressFilePath = path.join(
        __dirname,
        `files/boulder-routes-page-${pageNum}.json`
      );
      fs.writeFileSync(
        progressFilePath,
        JSON.stringify(boulderRoutesOnPage, null, 2)
      );

      // If we're not on the last page, go to the next page
      if (pageNum < totalPages && pageNum < maxPages) {
        // Instead of clicking, navigate directly to the next page URL
        const nextPageUrl = `https://www.mountainproject.com/route-finder?diffMaxaid=75260&diffMaxboulder=21700&diffMaxice=38500&diffMaxmixed=65050&diffMaxrock=12400&diffMinaid=70000&diffMinboulder=20000&diffMinice=30000&diffMinmixed=50000&diffMinrock=800&is_sport_climb=1&is_top_rope=1&is_trad_climb=1&pitches=0&selectedIds=0&stars=0&type=boulder&page=${
          pageNum + 1
        }`;

        await page.goto(nextPageUrl, { waitUntil: "networkidle2" });

        pageNum++;
      } else {
        console.log("Reached the last page or maximum page limit");
        break;
      }
    }
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);
  }

  await browser.close();

  // Save all routes to a single file
  const filePath = path.join(__dirname, "files/boulder-routes.json");
  fs.writeFileSync(filePath, JSON.stringify(allBoulderRoutes, null, 2));

  return allBoulderRoutes;
};

getBoulders()
  .then((routes) => {
    console.log(`Found a total of ${routes.length} boulder routes`);
    console.log("Data saved to files/boulder-routes.json");
  })
  .catch((error) => console.error("Error scraping boulder routes:", error));
