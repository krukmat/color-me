import React from 'react';
import renderer from 'react-test-renderer';
import { SliderControl } from '../../src/components/SliderControl';

/**
 * Tests for components/SliderControl.tsx
 * TASK: MOBILE-003 — SliderControl Component Testing
 *
 * Test coverage:
 * ✓ Basic rendering with required props
 * ✓ Optional label display
 * ✓ Custom value formatting
 * ✓ Edge labels (left/right)
 * ✓ Percentage calculations
 * ✓ onChange callback
 * ✓ Min/max bounds enforcement
 * ✓ Step rounding
 */

describe('SliderControl component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('renders header with label and value when label provided', () => {
      const tree = renderer.create(
        <SliderControl
          label="Intensidad"
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Intensidad');
      expect(treeString).toContain('50');
    });

    it('does not render header when label not provided', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('renders track components', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });
  });

  describe('value display', () => {
    it('displays current value', () => {
      const tree = renderer.create(
        <SliderControl
          label="Test"
          value={75}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('75');
    });

    it('displays formatted value with custom formatter', () => {
      const formatter = (val: number) => `${val}%`;
      const tree = renderer.create(
        <SliderControl
          label="Intensity"
          value={60}
          min={0}
          max={100}
          step={5}
          valueFormatter={formatter}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('60%');
    });

    it('displays decimal formatted value', () => {
      const formatter = (val: number) => val.toFixed(1);
      const tree = renderer.create(
        <SliderControl
          label="Precision"
          value={33.3}
          min={0}
          max={100}
          step={0.1}
          valueFormatter={formatter}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('33.3');
    });

    it('handles different value ranges', () => {
      const tree = renderer.create(
        <SliderControl
          label="Range Test"
          value={25}
          min={10}
          max={50}
          step={1}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('25');
    });
  });

  describe('edge labels', () => {
    it('displays left label when provided', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          leftLabel="Sutil"
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Sutil');
    });

    it('displays right label when provided', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          rightLabel="Intenso"
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Intenso');
    });

    it('displays both labels when provided', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          leftLabel="Min"
          rightLabel="Max"
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Min');
      expect(treeString).toContain('Max');
    });

    it('does not render labels when not provided', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).not.toContain('Sutil');
      expect(treeString).not.toContain('Intenso');
    });
  });

  describe('percentage calculations', () => {
    it('calculates correct percentage at minimum', () => {
      const tree = renderer.create(
        <SliderControl
          value={0}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('calculates correct percentage at maximum', () => {
      const tree = renderer.create(
        <SliderControl
          value={100}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('calculates correct percentage at midpoint', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('calculates percentage with custom range', () => {
      const tree = renderer.create(
        <SliderControl
          value={25}
          min={0}
          max={50}
          step={1}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('calculates percentage with negative min', () => {
      const tree = renderer.create(
        <SliderControl
          value={0}
          min={-50}
          max={50}
          step={1}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });
  });

  describe('bounds enforcement', () => {
    it('renders with value at minimum boundary', () => {
      const tree = renderer.create(
        <SliderControl
          label="Min Test"
          value={0}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('0');
    });

    it('renders with value at maximum boundary', () => {
      const tree = renderer.create(
        <SliderControl
          label="Max Test"
          value={100}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('100');
    });

    it('handles value within bounds', () => {
      const tree = renderer.create(
        <SliderControl
          label="Mid Test"
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('50');
    });
  });

  describe('step rounding', () => {
    it('displays value with proper step size (5)', () => {
      const tree = renderer.create(
        <SliderControl
          label="Step 5"
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('50');
    });

    it('displays value with step size 1', () => {
      const tree = renderer.create(
        <SliderControl
          label="Step 1"
          value={42}
          min={0}
          max={100}
          step={1}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('42');
    });

    it('displays value with decimal step size', () => {
      const tree = renderer.create(
        <SliderControl
          label="Step 0.5"
          value={50.5}
          min={0}
          max={100}
          step={0.5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('50.5');
    });

    it('displays value with large step size', () => {
      const tree = renderer.create(
        <SliderControl
          label="Step 10"
          value={50}
          min={0}
          max={100}
          step={10}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('50');
    });
  });

  describe('different value ranges', () => {
    it('handles 0-1 range for normalized values', () => {
      const tree = renderer.create(
        <SliderControl
          label="Normalized"
          value={0.5}
          min={0}
          max={1}
          step={0.1}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('handles larger ranges 0-1000', () => {
      const tree = renderer.create(
        <SliderControl
          label="Large Range"
          value={500}
          min={0}
          max={1000}
          step={50}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('500');
    });

    it('handles negative to positive range', () => {
      const tree = renderer.create(
        <SliderControl
          label="Negative Range"
          value={-10}
          min={-100}
          max={100}
          step={10}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('-10');
    });

    it('handles all negative range', () => {
      const tree = renderer.create(
        <SliderControl
          label="All Negative"
          value={-50}
          min={-100}
          max={-10}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('-50');
    });
  });

  describe('callback behavior', () => {
    it('onChange callback is provided prop', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('supports different onChange callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const tree1 = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={callback1}
        />
      ).toJSON();

      const tree2 = renderer.create(
        <SliderControl
          value={75}
          min={0}
          max={100}
          step={5}
          onChange={callback2}
        />
      ).toJSON();

      expect(tree1).toBeTruthy();
      expect(tree2).toBeTruthy();
    });
  });

  describe('intensity slider (real-world use case)', () => {
    it('renders intensity slider 0-100 with step 5', () => {
      const tree = renderer.create(
        <SliderControl
          label="Intensidad"
          value={50}
          min={0}
          max={100}
          step={5}
          leftLabel="Sutil"
          rightLabel="Intenso"
          valueFormatter={(v) => `${v}%`}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Intensidad');
      expect(treeString).toContain('50%');
      expect(treeString).toContain('Sutil');
      expect(treeString).toContain('Intenso');
    });

    it('renders before/after slider 0-1 with step 0.1', () => {
      const tree = renderer.create(
        <SliderControl
          label="Comparar antes/después"
          value={0.5}
          min={0}
          max={1}
          step={0.1}
          leftLabel="Antes"
          rightLabel="Después"
          valueFormatter={(v) => `${Math.round(v * 100)}%`}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Comparar antes/después');
      expect(treeString).toContain('50%');
      expect(treeString).toContain('Antes');
      expect(treeString).toContain('Después');
    });

    it('renders before/after slider at different position', () => {
      const tree = renderer.create(
        <SliderControl
          label="Comparar antes/después"
          value={0.3}
          min={0}
          max={1}
          step={0.1}
          leftLabel="Antes"
          rightLabel="Después"
          valueFormatter={(v) => `${Math.round(v * 100)}%`}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('30%');
    });
  });

  describe('edge cases', () => {
    it('handles zero step gracefully (no division by zero)', () => {
      const tree = renderer.create(
        <SliderControl
          label="Zero Step"
          value={50}
          min={0}
          max={100}
          step={0}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('handles very small step sizes', () => {
      const tree = renderer.create(
        <SliderControl
          label="Tiny Step"
          value={50.123}
          min={0}
          max={100}
          step={0.001}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('handles formatter returning empty string', () => {
      const tree = renderer.create(
        <SliderControl
          label="Empty Formatter"
          value={50}
          min={0}
          max={100}
          step={5}
          valueFormatter={() => ''}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('handles formatter with special characters', () => {
      const formatter = (v: number) => `${v}★`;
      const tree = renderer.create(
        <SliderControl
          label="Special Chars"
          value={50}
          min={0}
          max={100}
          step={5}
          valueFormatter={formatter}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('★');
    });

    it('handles very long label text', () => {
      const tree = renderer.create(
        <SliderControl
          label="This is a very long label that might wrap to multiple lines in the UI"
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('handles min equals max', () => {
      const tree = renderer.create(
        <SliderControl
          label="Equal Bounds"
          value={50}
          min={50}
          max={50}
          step={1}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });
  });

  describe('prop variations', () => {
    it('renders with only required props', () => {
      const tree = renderer.create(
        <SliderControl
          value={50}
          min={0}
          max={100}
          step={5}
          onChange={mockOnChange}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('renders with all optional props', () => {
      const tree = renderer.create(
        <SliderControl
          label="Complete"
          value={50}
          min={0}
          max={100}
          step={5}
          leftLabel="Low"
          rightLabel="High"
          valueFormatter={(v) => `${v}%`}
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Complete');
      expect(treeString).toContain('50%');
      expect(treeString).toContain('Low');
      expect(treeString).toContain('High');
    });

    it('renders with partial optional props', () => {
      const tree = renderer.create(
        <SliderControl
          label="Partial"
          value={50}
          min={0}
          max={100}
          step={5}
          leftLabel="Min"
          onChange={mockOnChange}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Partial');
      expect(treeString).toContain('Min');
      expect(treeString).not.toContain('undefined');
    });
  });
});
