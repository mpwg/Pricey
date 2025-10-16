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

#!/usr/bin/env node

/**
 * This script checks if all required environment variables are set
 * Run with: node scripts/check-env.js
 */

const requiredEnvVars = ["DATABASE_URL", "REDIS_URL", "NEXT_PUBLIC_APP_URL"];

const optionalEnvVars = [
  "NODE_ENV",
  "SCRAPER_API_KEY",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

console.log("🔍 Checking environment variables...\n");

let hasErrors = false;

// Check required variables
console.log("Required variables:");
requiredEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - MISSING`);
    hasErrors = true;
  }
});

// Check optional variables
console.log("\nOptional variables:");
optionalEnvVars.forEach((varName) => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`⚠️  ${varName} - Not set (optional)`);
  }
});

if (hasErrors) {
  console.log("\n❌ Some required environment variables are missing!");
  console.log("Please check your .env file.");
  process.exit(1);
} else {
  console.log("\n✅ All required environment variables are set!");
  process.exit(0);
}
