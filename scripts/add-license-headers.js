#!/usr/bin/env node

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

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

const LICENSE_HEADER_JS = `/**
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

`;

const LICENSE_HEADER_CSS = `/*
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

`;

function hasLicenseHeader(content) {
  return (
    content.includes("GNU Affero General Public License") ||
    content.includes("AGPL") ||
    content.includes("Copyright (C) 2025 Matthias Wallner-Géhri")
  );
}

function addLicenseHeader(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Skip if already has license header
  if (hasLicenseHeader(content)) {
    console.log(`⏭️  Skipping ${filePath} (already has license header)`);
    return;
  }

  const ext = path.extname(filePath);
  let newContent;

  if (ext === ".css") {
    newContent = LICENSE_HEADER_CSS + content;
  } else {
    newContent = LICENSE_HEADER_JS + content;
  }

  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`✅ Added license header to ${filePath}`);
}

async function main() {
  const patterns = [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
    "src/**/*.css",
    "scripts/**/*.js",
    "*.mjs",
    "*.config.{js,mjs,ts}",
  ];

  console.log("🔍 Finding source files...\n");

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        "scripts/add-license-headers.js",
      ],
    });

    for (const file of files) {
      addLicenseHeader(file);
    }
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
