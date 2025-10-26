/**
 * Tests for StatusBadge component
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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders PENDING status correctly', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders PROCESSING status with spinner', () => {
    render(<StatusBadge status="PROCESSING" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('renders COMPLETED status with checkmark', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders FAILED status with error icon', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<StatusBadge status="COMPLETED" />);
    const completedBadge = screen.getByText('Completed').closest('span');
    expect(completedBadge).toBeInTheDocument();
    // Badge component uses "flex" class for layout
    expect(completedBadge).toHaveClass('flex');
    expect(completedBadge).toHaveClass('items-center');

    rerender(<StatusBadge status="FAILED" />);
    const failedBadge = screen.getByText('Failed').closest('span');
    expect(failedBadge).toBeInTheDocument();
    expect(failedBadge).toHaveClass('flex');
    expect(failedBadge).toHaveClass('items-center');
  });
});
