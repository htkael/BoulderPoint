import puppeteer, {Browser, Page} from "puppeteer";
import { ClimbingLocation } from "../types";

export abstract class BaseScraper {
    protected browser: Browser | null = null;
    protected page : Page | null = null
    protected readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    async initialize(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: false,
        })

        this.page = await this.browser.newPage()

        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          );

        this.page.setDefaultNavigationTimeout(60000)
    }

    async close(): Promise<void> {
        this.browser?.close()
        this.browser = null
        this.page = null
    }

    protected async randomDelay(min: number = 1000, max: number = 5000): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1) + min)
        await new Promise(resolve => setTimeout(resolve, delay))
    }

    abstract scrape(): Promise<ClimbingLocation[]>
}