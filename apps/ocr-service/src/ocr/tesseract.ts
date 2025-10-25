/**
 * Tesseract OCR wrapper with image preprocessing
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

import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';

export interface OCRResult {
  text: string;
  confidence: number;
}

export class TesseractOCR {
  /**
   * Process receipt image with OCR
   * @param imageBuffer - Raw image buffer
   * @returns OCR result with text and confidence
   */
  async processReceipt(imageBuffer: Buffer): Promise<OCRResult> {
    // Preprocess image
    const preprocessed = await this.preprocessImage(imageBuffer);

    // Create Tesseract worker
    const worker = await createWorker('eng');

    try {
      // Configure Tesseract
      await worker.setParameters({
        tessedit_char_whitelist:
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/:-() \n\t',
        tessedit_pageseg_mode: PSM.AUTO,
      });

      // Perform OCR
      const {
        data: { text, confidence },
      } = await worker.recognize(preprocessed);

      return {
        text: text.trim(),
        confidence: confidence / 100, // Convert to 0-1 range
      };
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   * @param imageBuffer - Raw image buffer
   * @returns Preprocessed image buffer
   */
  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    return (
      sharp(imageBuffer)
        // Convert to grayscale
        .greyscale()
        // Normalize contrast
        .normalize()
        // Sharpen image
        .sharpen()
        // Resize if too large (max width 2000px)
        .resize({
          width: 2000,
          withoutEnlargement: true,
          fit: 'inside',
        })
        // Convert to PNG for best OCR results
        .png()
        .toBuffer()
    );
  }
}
