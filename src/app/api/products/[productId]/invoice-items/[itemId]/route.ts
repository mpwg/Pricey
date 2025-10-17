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
  { params }: { params: { productId: string; itemId: string } }
) {
  try {
    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        id: params.itemId,
        productId: params.productId,
      },
    });

    if (!invoiceItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice item not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoiceItem,
    } as ApiResponse<InvoiceItem>);
  } catch (error) {
    console.error("Error fetching invoice item:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice item",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string; itemId: string } }
) {
  try {
    const body = await request.json();
    const { date, storeDescription, price, unit } = body;

    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        id: params.itemId,
        productId: params.productId,
      },
    });

    if (!invoiceItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice item not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const updatedInvoiceItem = await prisma.invoiceItem.update({
      where: { id: params.itemId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(storeDescription && { storeDescription }),
        ...(price && { price: parseFloat(price) }),
        ...(unit && { unit }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoiceItem,
      message: "Invoice item updated successfully",
    } as ApiResponse<InvoiceItem>);
  } catch (error) {
    console.error("Error updating invoice item:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update invoice item",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; itemId: string } }
) {
  try {
    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        id: params.itemId,
        productId: params.productId,
      },
    });

    if (!invoiceItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice item not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    await prisma.invoiceItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({
      success: true,
      message: "Invoice item deleted successfully",
    } as ApiResponse<never>);
  } catch (error) {
    console.error("Error deleting invoice item:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice item",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
