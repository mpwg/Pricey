import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";

// Create a queue for scraping jobs
export const scrapeQueue = new Queue("scrape", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600, // keep up to 24 hours
      count: 1000, // keep up to 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // keep up to 7 days
    },
  },
});

// Job types
export interface ScrapeJobData {
  productId: string;
  url: string;
  retailer: string;
}

// Add a scrape job
export async function addScrapeJob(data: ScrapeJobData) {
  return await scrapeQueue.add("scrape-product", data);
}

// Create a worker (you'll expand this in a separate file)
export function createScrapeWorker() {
  return new Worker(
    "scrape",
    async (job: Job<ScrapeJobData>) => {
      console.log(`Processing scrape job ${job.id} for ${job.data.retailer}`);
      // TODO: Implement actual scraping logic
      // This is just a placeholder
      return { success: true, productId: job.data.productId };
    },
    {
      connection: redis,
    }
  );
}
