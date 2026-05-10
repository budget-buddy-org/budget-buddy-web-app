import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useThemeStore } from '@/stores/theme.store';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

describe('Dialog', () => {
  it('renders DialogDescription when showDescriptions is true', () => {
    useThemeStore.getState().setShowDescriptions(true);

    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description Text</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Description Text')).toBeInTheDocument();
  });

  it('does NOT render DialogDescription when showDescriptions is false', () => {
    useThemeStore.getState().setShowDescriptions(false);

    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description Text</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText('Description Text')).not.toBeInTheDocument();

    // Cleanup
    useThemeStore.getState().setShowDescriptions(true);
  });
});
