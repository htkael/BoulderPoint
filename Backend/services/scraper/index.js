const puppeteer = require("puppeteer");

const getBoulders = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1440,
      height: 800,
    },
  });
  const page = await browser.newPage();

  await page.goto(
    "https://www.mountainproject.com/route-finder?type=boulder&diffMinrock=800&diffMinboulder=20000&diffMinaid=70000&diffMinice=30000&diffMinmixed=50000&diffMaxrock=12400&diffMaxboulder=21700&diffMaxaid=75260&diffMaxice=38500&diffMaxmixed=65050&is_trad_climb=1&is_sport_climb=1&is_top_rope=1&stars=0&pitches=0&selectedIds=0"
  );

  await page.waitForSelector(".table.route-table");

  const boulderRoutes = await page.evaluate(() => {
    // Only select rows that actually contain data (have a first child with an anchor tag)
    const rows = Array.from(
      document.querySelectorAll(
        ".table.route-table.hidden-xs-down tr:not(.screen-reader-only)"
      )
    ).filter((row) => row.querySelector("td:first-child a"));

    return rows.map((row) => {
      const nameElement = row.querySelector("td:first-child a");
      const name = nameElement ? nameElement.textContent.trim() : "N/A";
      const routeLink = nameElement ? nameElement.href : "N/A";

      const locationElement = row.querySelector("td:nth-child(2) .text-warm");

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

  await browser.close();

  return boulderRoutes;
};

getBoulders()
  .then((routes) => {
    console.log(`Found ${routes.length} boulder routes`);
    console.log(JSON.stringify(routes, null, 2));
  })
  .catch((error) => console.error("Error scraping boulder routes:", error));
