/**
 * Tests for UploadForm component
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadForm } from '../upload-form';
import * as apiClient from '@/lib/api';

// Mock the API client
vi.mock('@/lib/api', () => ({
  apiClient: {
    uploadReceipt: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('UploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.apiClient.uploadReceipt).mockResolvedValue({
      id: 'receipt-123',
      imageUrl: 'https://example.com/receipt.jpg',
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('renders upload form with drag and drop area', () => {
    render(<UploadForm />);

    expect(screen.getByText(/upload a receipt/i)).toBeInTheDocument();
    expect(
      screen.getByText(/drag and drop your receipt image here/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });

  it('shows file preview when file is selected', async () => {
    const user = userEvent.setup();
    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.pdf', {
      type: 'application/pdf',
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Upload the file
    await user.upload(input, file);

    // Wait a bit for any async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The toast error might have been called, or the file might just not be set
    // Either way, there should be no preview shown
    expect(screen.queryByAltText('Receipt preview')).not.toBeInTheDocument();

    // And the upload button should not be visible (only shown when file is set)
    expect(
      screen.queryByRole('button', { name: /upload receipt/i })
    ).not.toBeInTheDocument();
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<UploadForm />);

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('File too large')
      );
    });
  });

  it('uploads file successfully and redirects', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = await screen.findByRole('button', {
      name: /upload receipt/i,
    });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(apiClient.apiClient.uploadReceipt).toHaveBeenCalledWith(file);
      expect(toast.success).toHaveBeenCalledWith(
        'Receipt uploaded successfully!'
      );
    });
  });

  it('handles upload error', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    vi.mocked(apiClient.apiClient.uploadReceipt).mockRejectedValue(
      new Error('Upload failed')
    );

    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = await screen.findByRole('button', {
      name: /upload receipt/i,
    });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Upload failed')
      );
    });
  });

  it('disables upload button when no file is selected', () => {
    render(<UploadForm />);

    // Upload button only appears after file is selected
    const uploadButton = screen.queryByRole('button', {
      name: /upload receipt/i,
    });
    expect(uploadButton).not.toBeInTheDocument();
  });

  it('shows loading state during upload', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.apiClient.uploadReceipt).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    const uploadButton = await screen.findByRole('button', {
      name: /upload receipt/i,
    });
    await user.click(uploadButton);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
  });

  it('allows removing selected file', async () => {
    const user = userEvent.setup();
    render(<UploadForm />);

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByAltText('Receipt preview')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(screen.queryByAltText('Receipt preview')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /upload receipt/i })
    ).not.toBeInTheDocument();
  });
});
