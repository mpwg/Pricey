/**
 * Upload form component for receipt upload
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { isValidImageFile, isValidFileSize } from '@/lib/format';
import { ImagePreview } from './image-preview';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!isValidImageFile(selectedFile)) {
      toast.error(
        'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      );
      return;
    }

    // Validate file size
    if (!isValidFileSize(selectedFile)) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const receipt = await apiClient.uploadReceipt(file);
      toast.success('Receipt uploaded successfully!');
      router.push(`/receipts/${receipt.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to upload receipt. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card
        className={`border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <ImagePreview url={previewUrl} onClear={handleClear} />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload a receipt</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your receipt image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
              id="receipt-upload"
              disabled={uploading}
              capture="environment"
            />
            <label htmlFor="receipt-upload">
              <Button type="button" variant="secondary" size="lg" asChild>
                <span className="cursor-pointer">Choose File</span>
              </Button>
            </label>
          </div>
        )}
      </Card>

      {file && (
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Receipt'
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
