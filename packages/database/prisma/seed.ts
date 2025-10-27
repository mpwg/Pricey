/**
 * Seed script for Pricey database
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAJOR_STORES = [
  // Supermarkets / Lebensmittel
  {
    name: 'Billa',
    aliases: ['BILLA', 'BILLA PLUS', 'Billa Plus'],
    logoUrl: 'https://logo.clearbit.com/billa.at',
  },
  {
    name: 'Spar',
    aliases: ['SPAR', 'INTERSPAR', 'EUROSPAR', 'Spar Gourmet'],
    logoUrl: 'https://logo.clearbit.com/spar.at',
  },
  {
    name: 'Hofer',
    aliases: ['HOFER', 'HOFER KG'],
    logoUrl: 'https://logo.clearbit.com/hofer.at',
  },
  {
    name: 'Lidl',
    aliases: ['LIDL', 'LIDL ÖSTERREICH'],
    logoUrl: 'https://logo.clearbit.com/lidl.at',
  },
  {
    name: 'Penny',
    aliases: ['PENNY', 'PENNY MARKT'],
    logoUrl: 'https://logo.clearbit.com/penny.at',
  },
  {
    name: 'MPreis',
    aliases: ['MPREIS', 'M-PREIS'],
    logoUrl: 'https://logo.clearbit.com/mpreis.at',
  },
  {
    name: 'Merkur',
    aliases: ['MERKUR', 'MERKUR MARKT'],
    logoUrl: 'https://logo.clearbit.com/merkurmarkt.at',
  },
  {
    name: 'Unimarkt',
    aliases: ['UNIMARKT'],
    logoUrl: 'https://logo.clearbit.com/unimarkt.at',
  },
  {
    name: 'Adeg',
    aliases: ['ADEG', 'ADEG MARKT'],
    logoUrl: 'https://logo.clearbit.com/adeg.at',
  },
  {
    name: 'Nah & Frisch',
    aliases: ['NAH & FRISCH', 'NAH UND FRISCH'],
    logoUrl: 'https://logo.clearbit.com/nah-frisch.at',
  },
  // Drogeriemärkte
  {
    name: 'dm',
    aliases: ['DM', 'DM DROGERIE MARKT', 'dm drogerie markt'],
    logoUrl: 'https://logo.clearbit.com/dm.at',
  },
  {
    name: 'Müller',
    aliases: ['MÜLLER', 'MUELLER', 'Müller Drogerie'],
    logoUrl: 'https://logo.clearbit.com/muller.at',
  },
  {
    name: 'Bipa',
    aliases: ['BIPA'],
    logoUrl: 'https://logo.clearbit.com/bipa.at',
  },
  // Baumärkte / Hardware
  {
    name: 'Bauhaus',
    aliases: ['BAUHAUS'],
    logoUrl: 'https://logo.clearbit.com/bauhaus.at',
  },
  {
    name: 'OBI',
    aliases: ['OBI', 'OBI BAUMARKT'],
    logoUrl: 'https://logo.clearbit.com/obi.at',
  },
  {
    name: 'Hornbach',
    aliases: ['HORNBACH'],
    logoUrl: 'https://logo.clearbit.com/hornbach.at',
  },
  // Elektromärkte
  {
    name: 'MediaMarkt',
    aliases: ['MEDIAMARKT', 'MEDIA MARKT'],
    logoUrl: 'https://logo.clearbit.com/mediamarkt.at',
  },
  {
    name: 'Saturn',
    aliases: ['SATURN'],
    logoUrl: 'https://logo.clearbit.com/saturn.at',
  },
  {
    name: 'Hartlauer',
    aliases: ['HARTLAUER'],
    logoUrl: 'https://logo.clearbit.com/hartlauer.at',
  },
  // Tankstellen / Gas Stations
  {
    name: 'OMV',
    aliases: ['OMV', 'OMV TANKSTELLE'],
    logoUrl: 'https://logo.clearbit.com/omv.at',
  },
  {
    name: 'BP',
    aliases: ['BP', 'BP TANKSTELLE'],
    logoUrl: 'https://logo.clearbit.com/bp.com',
  },
  {
    name: 'Shell',
    aliases: ['SHELL', 'SHELL TANKSTELLE'],
    logoUrl: 'https://logo.clearbit.com/shell.at',
  },
  // Möbel / Furniture
  {
    name: 'IKEA',
    aliases: ['IKEA'],
    logoUrl: 'https://logo.clearbit.com/ikea.com',
  },
  {
    name: 'XXXLutz',
    aliases: ['XXXLUTZ', 'XXX LUTZ', 'Lutz'],
    logoUrl: 'https://logo.clearbit.com/xxxlutz.at',
  },
  // Mode / Fashion
  {
    name: 'H&M',
    aliases: ['H&M', 'H & M', 'HM'],
    logoUrl: 'https://logo.clearbit.com/hm.com',
  },
  {
    name: 'C&A',
    aliases: ['C&A', 'C & A'],
    logoUrl: 'https://logo.clearbit.com/c-and-a.com',
  },
  // Apotheken / Pharmacies
  {
    name: 'Apotheke',
    aliases: ['APOTHEKE', 'APOTHEKE ZUR', 'STADTAPOTHEKE'],
    logoUrl: null,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in development
  await prisma.productPrice.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Seed stores
  console.log('📦 Seeding stores...');
  for (const storeData of MAJOR_STORES) {
    await prisma.store.create({
      data: storeData,
    });
  }
  console.log(`✅ Created ${MAJOR_STORES.length} stores`);

  // Create a test user (for development)
  if (process.env.NODE_ENV === 'development') {
    console.log('👤 Creating test user...');
    await prisma.user.create({
      data: {
        email: 'test@pricey.app',
        name: 'Test User',
      },
    });
    console.log('✅ Created test user');
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
