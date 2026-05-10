import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useThemeStore } from '@/stores/theme.store';
import { PageHeader } from './PageHeader';

// Mock the FAB hook as it's not relevant for this test
vi.mock('@/hooks/use-fab', () => ({
  useFABAction: vi.fn(),
}));

describe('PageHeader', () => {
  it('renders title and subtitle when showDescriptions is true', () => {
    // Default is true in the store, but we can be explicit if needed
    // However, since we are using the real store, let's just use it
    useThemeStore.getState().setShowDescriptions(true);

    render(<PageHeader title="Test Title" subtitle="Test Subtitle" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders title but NOT subtitle when showDescriptions is false', () => {
    useThemeStore.getState().setShowDescriptions(false);

    render(<PageHeader title="Test Title" subtitle="Test Subtitle" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument();

    // Cleanup
    useThemeStore.getState().setShowDescriptions(true);
  });

  it('renders subtitle even if showDescriptions is false when isSubtitleEssential is true', () => {
    useThemeStore.getState().setShowDescriptions(false);

    render(<PageHeader title="Test Title" subtitle="Essential Subtitle" isSubtitleEssential />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Essential Subtitle')).toBeInTheDocument();

    // Cleanup
    useThemeStore.getState().setShowDescriptions(true);
  });
});
