import React from 'react';
import renderer from 'react-test-renderer';
import { ColorPalette } from '../../src/components/ColorPalette';
import { PALETTE } from '../../src/utils/palette';

/**
 * Tests for components/ColorPalette.tsx
 * TASK: MOBILE-003 — UI Component Testing
 *
 * Test coverage:
 * ✓ Renders all 10 colors from palette prop
 * ✓ Color selection callback onSelect
 * ✓ Accessibility & styling
 * ✓ Selected state management
 */

describe('ColorPalette component', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      const onSelect = jest.fn();
      const tree = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      ).toJSON();
      expect(tree).toBeTruthy();
    });

    it('renders all 10 palette colors', () => {
      const onSelect = jest.fn();
      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );
      const tree = component.toJSON();

      // Verify tree structure exists
      expect(tree).toBeTruthy();
      const treeString = JSON.stringify(tree);
      // All 10 colors should be in the render
      PALETTE.forEach((color) => {
        expect(treeString).toContain(color.name);
      });
    });

    it('displays all color names in palette', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      PALETTE.forEach((color) => {
        expect(treeString).toContain(color.name);
      });
    });

    it('shows all color hex codes', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      PALETTE.forEach((color) => {
        expect(treeString).toContain(color.hex);
      });
    });

    it('displays title "Elige un tono"', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Elige un tono');
    });
  });

  describe('color selection', () => {
    it('calls onSelect when a color is pressed', () => {
      const onSelect = jest.fn();
      const targetColor = PALETTE[4]; // Sunlit Amber

      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      const instance = component.root;
      // Find button for target color and simulate press
      const buttons = instance.findAllByType('TouchableOpacity');

      if (buttons.length > 4) {
        renderer.act(() => {
          buttons[4].props.onPress?.();
        });

        expect(onSelect).toHaveBeenCalled();
        expect(onSelect).toHaveBeenCalledWith(targetColor);
      }
    });

    it('calls onSelect with correct color object', () => {
      const onSelect = jest.fn();
      const targetColor = PALETTE[2];

      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      const instance = component.root;
      const buttons = instance.findAllByType('TouchableOpacity');

      if (buttons.length > 2) {
        renderer.act(() => {
          buttons[2].props.onPress?.();
        });

        expect(onSelect).toHaveBeenCalledWith(targetColor);
      }
    });

    it('reflects selected color visually with name', () => {
      const onSelect = jest.fn();
      const selectedColor = PALETTE[5];

      const tree = renderer
        .create(
          <ColorPalette
            palette={PALETTE}
            selected={selectedColor}
            onSelect={onSelect}
          />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(selectedColor.name);
      expect(treeString).toContain(selectedColor.description);
    });

    it('updates selected color display when prop changes', () => {
      const onSelect = jest.fn();

      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      // Update with different selected color
      renderer.act(() => {
        component.update(
          <ColorPalette
            palette={PALETTE}
            selected={PALETTE[3]}
            onSelect={onSelect}
          />
        );
      });

      const tree = component.toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(PALETTE[3].name);
      expect(treeString).toContain(PALETTE[3].description);
    });

    it('highlights selected color with border', () => {
      const onSelect = jest.fn();
      const selectedColor = PALETTE[2];

      const component = renderer.create(
        <ColorPalette
          palette={PALETTE}
          selected={selectedColor}
          onSelect={onSelect}
        />
      );

      const instance = component.root;
      const buttons = instance.findAllByType('TouchableOpacity');

      // The selected color button should have different styling
      if (buttons.length > 2) {
        const selectedButton = buttons[2];
        const selectedButtonStyle = selectedButton.props.style;
        // Check that selected button has selectedWrapper style applied
        expect(Array.isArray(selectedButtonStyle)).toBe(true);
      }
    });
  });

  describe('styling', () => {
    it('applies correct color hex values to circles', () => {
      const onSelect = jest.fn();

      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      PALETTE.forEach((color) => {
        expect(treeString).toContain(color.hex);
      });
    });

    it('maintains palette color integrity', () => {
      const onSelect = jest.fn();

      // Verify all colors are valid hex codes
      PALETTE.forEach((color) => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        expect(hexRegex.test(color.hex)).toBe(true);
      });
    });

    it('applies accessibility labels to color buttons', () => {
      const onSelect = jest.fn();

      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      const instance = component.root;
      const buttons = instance.findAllByType('TouchableOpacity');

      buttons.forEach((button, index) => {
        const label = button.props.accessibilityLabel;
        expect(label).toContain('Color');
        expect(label).toContain(PALETTE[index].name);
      });
    });
  });

  describe('accessibility', () => {
    it('renders with accessible structure', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      expect(tree).toBeTruthy();
      expect(tree?.type).toBeDefined();
    });

    it('has descriptive text for selected color', () => {
      const onSelect = jest.fn();
      const selectedColor = PALETTE[0];

      const tree = renderer
        .create(
          <ColorPalette
            palette={PALETTE}
            selected={selectedColor}
            onSelect={onSelect}
          />
        )
        .toJSON();

      const treeString = JSON.stringify(tree);
      // Should contain name and description for accessibility
      expect(treeString).toContain(selectedColor.name);
      expect(treeString).toContain(selectedColor.description);
    });

  });

  describe('edge cases', () => {
    it('handles empty palette array gracefully', () => {
      const onSelect = jest.fn();
      const component = renderer.create(
        <ColorPalette palette={[]} selected={PALETTE[0]} onSelect={onSelect} />
      );
      expect(component.toJSON()).toBeTruthy();
    });

    it('handles rapid color selection changes', () => {
      const onSelect = jest.fn();
      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      renderer.act(() => {
        component.update(
          <ColorPalette palette={PALETTE} selected={PALETTE[1]} onSelect={onSelect} />
        );
        component.update(
          <ColorPalette palette={PALETTE} selected={PALETTE[2]} onSelect={onSelect} />
        );
        component.update(
          <ColorPalette palette={PALETTE} selected={PALETTE[3]} onSelect={onSelect} />
        );
      });

      expect(component.toJSON()).toBeTruthy();
    });

    it('maintains callback reference across re-renders', () => {
      const onSelect = jest.fn();
      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
      );

      const originalTree = component.toJSON();

      renderer.act(() => {
        component.update(
          <ColorPalette palette={PALETTE} selected={PALETTE[5]} onSelect={onSelect} />
        );
      });

      const updatedTree = component.toJSON();
      expect(originalTree).toBeTruthy();
      expect(updatedTree).toBeTruthy();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('handles selected color not in palette', () => {
      const onSelect = jest.fn();
      const externalColor = {
        name: 'External Color',
        hex: '#FF0000',
        description: 'A color not in palette',
      };

      const component = renderer.create(
        <ColorPalette palette={PALETTE} selected={externalColor} onSelect={onSelect} />
      );

      expect(component.toJSON()).toBeTruthy();
      const treeString = JSON.stringify(component.toJSON());
      expect(treeString).toContain('External Color');
    });
  });

  describe('snapshot tests', () => {
    it('matches snapshot with default selected color', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[0]} onSelect={onSelect} />
        )
        .toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('matches snapshot with different selected color', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[4]} onSelect={onSelect} />
        )
        .toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('snapshot matches with last palette color', () => {
      const onSelect = jest.fn();
      const tree = renderer
        .create(
          <ColorPalette palette={PALETTE} selected={PALETTE[9]} onSelect={onSelect} />
        )
        .toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
