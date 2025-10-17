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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse, InvoiceItem } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        productId: params.productId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: invoiceItems,
    } as ApiResponse<InvoiceItem[]>);
  } catch (error) {
    console.error("Error fetching invoice items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice items",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const body = await request.json();
    const { date, storeDescription, price, unit } = body;

    if (!date || !storeDescription || !price || !unit) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: date, storeDescription, price, unit",
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const invoiceItem = await prisma.invoiceItem.create({
      data: {
        productId: params.productId,
        date: new Date(date),
        storeDescription,
        price: parseFloat(price),
        unit,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: invoiceItem,
        message: "Invoice item created successfully",
      } as ApiResponse<InvoiceItem>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice item:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invoice item",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
