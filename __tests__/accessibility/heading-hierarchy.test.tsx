/**
 * Heading Hierarchy Tests
 *
 * Validates WCAG 2.4.6 - Headings and Labels compliance.
 * Ensures proper h1 → h2 → h3 nesting without skipped levels.
 */

/**
 * Helper: Extract heading levels from rendered component
 */
function getHeadingLevels(container: HTMLElement): number[] {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  return Array.from(headings).map((h) => parseInt(h.tagName[1]));
}

import { render } from '@testing-library/react';
import ReportsPage from '@/app/(dashboard)/reports/page';

/**
 * Helper: Check if heading hierarchy is valid (no skipped levels)
 */
function hasValidHierarchy(levels: number[]): boolean {
  if (levels.length === 0) return true;

  let maxSeen = 0;
  for (const level of levels) {
    // First heading should be h1 or h2 (some components start at h2)
    if (maxSeen === 0) {
      if (level > 2) return false;
      maxSeen = level;
      continue;
    }

    // Can increase by 1, stay same, or decrease to any previous level
    if (level > maxSeen + 1) return false;

    maxSeen = Math.max(maxSeen, level);
  }
  return true;
}

describe('Heading Hierarchy - WCAG 2.4.6', () => {
  describe('Reports Page', () => {
    it('has valid heading hierarchy (no skipped levels)', () => {
      const { container } = render(<ReportsPage />);
      const levels = getHeadingLevels(container);
      expect(hasValidHierarchy(levels)).toBe(true);
    });

    it('has exactly one h1 per page', () => {
      const { container } = render(<ReportsPage />);
      const headings = container.querySelectorAll('h1');
      expect(headings.length).toBe(1);
    });

    it('uses h3 for example report subsections (not h4)', () => {
      const { container } = render(<ReportsPage />);
      const subsectionHeadings = Array.from(container.querySelectorAll('h3'))
        .map((node) => node.textContent?.trim())
        .filter(Boolean);
      expect(subsectionHeadings.length).toBeGreaterThanOrEqual(3);
      expect(container.querySelectorAll('h4').length).toBe(0);
    });

    it('all headings have non-empty text content', () => {
      const { container } = render(<ReportsPage />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading) => {
        expect(heading.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Heading Hierarchy Validation Logic', () => {
    it('validates correct hierarchies', () => {
      expect(hasValidHierarchy([1, 2, 3])).toBe(true);
      expect(hasValidHierarchy([1, 2, 2, 3])).toBe(true);
      expect(hasValidHierarchy([2, 3, 3, 2, 3])).toBe(true);
      expect(hasValidHierarchy([1])).toBe(true);
      expect(hasValidHierarchy([])).toBe(true);
    });

    it('rejects invalid hierarchies (skipped levels)', () => {
      expect(hasValidHierarchy([1, 3])).toBe(false); // Skips h2
      expect(hasValidHierarchy([1, 2, 4])).toBe(false); // Skips h3
      expect(hasValidHierarchy([2, 4])).toBe(false); // Skips h3
      expect(hasValidHierarchy([3, 4])).toBe(false); // Starts too high
    });

    it('allows decreasing to any previous level', () => {
      expect(hasValidHierarchy([1, 2, 3, 1])).toBe(true); // h3 → h1 OK
      expect(hasValidHierarchy([1, 2, 3, 2])).toBe(true); // h3 → h2 OK
      expect(hasValidHierarchy([2, 3, 2, 3])).toBe(true); // Back and forth OK
    });
  });
});
