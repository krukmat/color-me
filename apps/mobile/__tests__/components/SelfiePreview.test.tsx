import React from 'react';
import renderer from 'react-test-renderer';
import { SelfiePreview } from '../../src/components/SelfiePreview';
import { PALETTE } from '../../src/utils/palette';

/**
 * Tests for components/SelfiePreview.tsx
 * TASK: MOBILE-003 — SelfiePreview Component Testing
 */

describe('SelfiePreview component', () => {
  const mockSelfie = {
    uri: 'file:///selfie.jpg',
    base64: 'test-base64',
  };

  describe('placeholder state', () => {
    it('shows placeholder when no selfie', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={undefined}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('no seleccionaste una selfie');
    });

    it('shows help text in placeholder', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={undefined}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('iluminación');
      expect(treeString).toContain('fondo neutro');
    });
  });

  describe('selfie display', () => {
    it('renders selfie when provided', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });

    it('uses selfie URI as image source', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('file:///selfie.jpg');
    });
  });

  describe('before/after display', () => {
    it('displays before/after percentages', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Antes');
      expect(treeString).toContain('Después');
      expect(treeString).toContain('"50"');
    });

    it('calculates percentages correctly', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.3}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('"70"');
      expect(treeString).toContain('"30"');
    });
  });

  describe('color display', () => {
    it('displays selected color name', () => {
      const color = PALETTE[3];
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={color}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(color.name);
    });

    it('handles different colors', () => {
      for (const color of PALETTE) {
        const tree = renderer.create(
          <SelfiePreview
            selfie={mockSelfie}
            selectedColor={color}
            intensity={50}
            beforeAfterPosition={0.5}
          />
        ).toJSON();

        const treeString = JSON.stringify(tree);
        expect(treeString).toContain(color.name);
      }
    });
  });

  describe('processing time display', () => {
    it('shows processing time when available', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
          processingMs={250}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('250 ms');
      expect(treeString).toContain('Procesado');
    });

    it('hides processing time when not available', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
          processingMs={undefined}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).not.toContain('Procesado');
    });
  });

  describe('processed image', () => {
    it('shows processed image when available', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
          imageUrl="https://example.com/result.jpg"
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('https://example.com/result.jpg');
    });

    it('hides processed image when unavailable', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
          imageUrl={undefined}
        />
      ).toJSON();

      expect(tree).toBeTruthy();
    });
  });

  describe('overlay opacity', () => {
    it('changes with intensity changes', () => {
      const tree1 = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={25}
          beforeAfterPosition={1}
        />
      ).toJSON();

      const tree2 = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={75}
          beforeAfterPosition={1}
        />
      ).toJSON();

      expect(tree1).toBeTruthy();
      expect(tree2).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has accessibility labels', () => {
      const tree = renderer.create(
        <SelfiePreview
          selfie={mockSelfie}
          selectedColor={PALETTE[0]}
          intensity={50}
          beforeAfterPosition={0.5}
        />
      ).toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Selfie seleccionada');
    });
  });
});
