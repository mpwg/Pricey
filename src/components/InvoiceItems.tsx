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

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { InvoiceItem } from "@/types";

interface InvoiceItemsProps {
  productId: string;
  productName: string;
}

interface InvoiceItemFormData {
  date: string;
  storeDescription: string;
  price: string;
  unit: string;
}

interface ErrorState {
  message: string;
  type: "error" | "success";
}

export function InvoiceItems({ productId, productName }: InvoiceItemsProps) {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InvoiceItemFormData>({
    date: new Date().toISOString().split("T")[0] ?? "",
    storeDescription: "",
    price: "",
    unit: "",
  });

  useEffect(() => {
    const loadInvoiceItems = async () => {
      try {
        const response = await fetch(
          `/api/products/${productId}/invoice-items`
        );
        const result = await response.json();
        if (result.success) {
          setInvoiceItems(result.data);
        }
      } catch (error) {
        console.error("Error fetching invoice items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceItems();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/products/${productId}/invoice-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setInvoiceItems([result.data, ...invoiceItems]);
        setFormData({
          date: new Date().toISOString().split("T")[0] ?? "",
          storeDescription: "",
          price: "",
          unit: "",
        });
        setShowForm(false);
        setError({
          message: "Rechnungsposten erfolgreich erstellt",
          type: "success",
        });
      } else {
        setError({
          message: result.error || "Fehler beim Erstellen des Rechnungspostens",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error creating invoice item:", error);
      setError({
        message: "Fehler beim Erstellen des Rechnungspostens",
        type: "error",
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    setError(null);

    try {
      const response = await fetch(
        `/api/products/${productId}/invoice-items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        setInvoiceItems(invoiceItems.filter((item) => item.id !== itemId));
        setError({ message: "Rechnungsposten gelöscht", type: "success" });
      } else {
        setError({
          message: result.error || "Fehler beim Löschen des Rechnungspostens",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      setError({
        message: "Fehler beim Löschen des Rechnungspostens",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("de-DE");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (loading) {
    return <div className="p-4">Lade Rechnungsposten...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Message */}
      {error && (
        <div
          className={`p-4 rounded-md ${
            error.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{error.message}</span>
            <button
              onClick={() => setError(null)}
              className="text-sm underline"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Rechnungsposten für {productName}
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? "Abbrechen" : "Neuer Eintrag"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Neuer Rechnungsposten</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preis</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bezeichnung (lt. Geschäft)
                </label>
                <Input
                  type="text"
                  placeholder="z.B. Bio-Äpfel Gala"
                  value={formData.storeDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      storeDescription: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Einheit
                </label>
                <Input
                  type="text"
                  placeholder="z.B. kg, Stück, l"
                  value={formData.unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Speichern
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </Card>
      )}

      {invoiceItems.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Noch keine Rechnungsposten für dieses Produkt vorhanden.
        </Card>
      ) : (
        <div className="space-y-3">
          {invoiceItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-semibold text-lg">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(item.date)}
                    </span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {item.unit}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.storeDescription}</p>
                </div>
                <div className="flex gap-2">
                  {deletingId === item.id ? (
                    <>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                      >
                        Bestätigen
                      </Button>
                      <Button
                        onClick={() => setDeletingId(null)}
                        className="bg-gray-600 hover:bg-gray-700 text-sm px-3 py-1"
                      >
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setDeletingId(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
