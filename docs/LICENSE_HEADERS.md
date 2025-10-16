# License Headers

## Overview

All source code files in the Pricey project **MUST** include the AGPL3 license header. This is a requirement to ensure proper copyright attribution and license compliance.

## Required Header

### For TypeScript/JavaScript files (.ts, .tsx, .js, .jsx, .mjs)

```typescript
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
```

### For CSS files (.css)

```css
/*
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
```

## Automated Tool

To automatically add license headers to all source files, run:

```bash
npm run add-license
```

This script will:

- Scan all source files in the project
- Add the appropriate license header if missing
- Skip files that already have the header
- Handle different comment styles for different file types

## When to Add Headers

- **New files**: All new source code files must include the header from creation
- **Existing files**: The automated tool has already added headers to all existing files
- **After pulling changes**: If you pull changes with new files missing headers, run `npm run add-license`

## Files That Should Have Headers

- All TypeScript files (`.ts`, `.tsx`)
- All JavaScript files (`.js`, `.jsx`, `.mjs`)
- All CSS files (`.css`)
- Configuration files in the root directory (`.config.ts`, `.config.mjs`, etc.)
- Script files in the `scripts/` directory

## Files That Should NOT Have Headers

- Markdown files (`.md`)
- JSON files (`.json`)
- YAML files (`.yml`, `.yaml`)
- Lock files (`package-lock.json`, etc.)
- Generated files (in `.next/`, `dist/`, `build/`, etc.)
- `node_modules/`

## Enforcement

The license header requirement should be enforced during:

- Code reviews
- CI/CD pipeline (consider adding a check)
- Pre-commit hooks (optional)

## Why AGPL3?

The GNU Affero General Public License v3 (AGPL3) is a strong copyleft license that:

- Ensures the software remains free and open source
- Requires modifications to be shared if the software is used over a network
- Protects users' freedoms to use, study, modify, and share the software
- Is compatible with the AGPL3 license used by the project

For more information about the AGPL3 license, see the [LICENSE.md](../LICENSE.md) file or visit <https://www.gnu.org/licenses/agpl-3.0.html>.
