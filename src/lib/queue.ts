/**
 * Pricey - Find the best price
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
      console.error(`Processing scrape job ${job.id} for ${job.data.retailer}`);
      // TODO: Implement actual scraping logic
      // This is just a placeholder
      return { success: true, productId: job.data.productId };
    },
    {
      connection: redis,
    }
  );
}
