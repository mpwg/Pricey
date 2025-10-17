# Datenmodell: Produkte und Rechnungsposten

## Übersicht

Das System wurde um ein Datenmodell für Produkte mit zugehörigen Rechnungsposten erweitert.

## Datenstruktur

### Produkte (Products)

- **id**: Eindeutige ID
- **name**: Produktname
- **description**: Optionale Beschreibung
- **imageUrl**: Optionales Produktbild
- **category**: Produktkategorie
- **brand**: Marke
- **createdAt/updatedAt**: Zeitstempel

### Rechnungsposten (InvoiceItems)

- **id**: Eindeutige ID
- **productId**: Verknüpfung zum Produkt
- **date**: Datum des Kaufs
- **storeDescription**: Bezeichnung lt. Geschäft
- **price**: Preis
- **unit**: Einheit (kg, Stück, l, etc.)
- **createdAt/updatedAt**: Zeitstempel

## API-Endpunkte

### Rechnungsposten für ein Produkt

- `GET /api/products/[productId]/invoice-items` - Alle Rechnungsposten abrufen
- `POST /api/products/[productId]/invoice-items` - Neuen Rechnungsposten erstellen

### Einzelner Rechnungsposten

- `GET /api/products/[productId]/invoice-items/[itemId]` - Einzelnen Posten abrufen
- `PUT /api/products/[productId]/invoice-items/[itemId]` - Posten bearbeiten
- `DELETE /api/products/[productId]/invoice-items/[itemId]` - Posten löschen

## Komponenten

### InvoiceItems-Komponente

- Zeigt alle Rechnungsposten für ein Produkt an
- Formular zum Hinzufügen neuer Einträge
- Löschen-Funktionalität
- Responsive Design mit Tailwind CSS

## Datenbankschema

```sql
-- Neue Tabelle für Rechnungsposten
CREATE TABLE "invoice_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "storeDescription" TEXT NOT NULL,
  "price" REAL NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indizes für bessere Performance
CREATE INDEX "invoice_items_productId_idx" ON "invoice_items"("productId");
CREATE INDEX "invoice_items_date_idx" ON "invoice_items"("date");
```

## Verwendung

```typescript
// InvoiceItems-Komponente verwenden
import { InvoiceItems } from "@/components/InvoiceItems";

<InvoiceItems productId="product-id-here" productName="Produktname" />;
```

## Migration

Die Datenbankänderungen wurden bereits mit Prisma migriert:

- Migration: `20251017173643_add_invoice_items`
- Datenbank: SQLite (Entwicklung)

## Nächste Schritte

1. Frontend-Integration in bestehende Produktseiten
2. Erweiterte Filterung und Sortierung
3. Export-Funktionalität für Rechnungsposten
4. Statistiken und Auswertungen
5. Produktvergleiche basierend auf historischen Preisen
