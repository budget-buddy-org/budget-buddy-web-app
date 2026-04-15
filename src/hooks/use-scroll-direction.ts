import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
  const prevOffsetRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentOffset = window.scrollY;
      const prevOffset = prevOffsetRef.current;

      // Minimum threshold to prevent jitter
      if (Math.abs(currentOffset - prevOffset) < 10) {
        return;
      }

      if (currentOffset > prevOffset && currentOffset > 50) {
        setScrollDirection('down');
      } else if (currentOffset < prevOffset) {
        setScrollDirection('up');
      }

      prevOffsetRef.current = currentOffset;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollDirection;
}
