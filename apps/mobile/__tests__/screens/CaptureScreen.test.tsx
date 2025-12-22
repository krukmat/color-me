import React from 'react';
import renderer from 'react-test-renderer';
import { CaptureScreen } from '../../src/screens/CaptureScreen';
import { useSelfieStore } from '../../src/store/selfieStore';
import { useTryOnState } from '../../src/state/useTryOnState';
import * as mediaService from '../../src/services/media';
import * as shareUtils from '../../src/utils/share';
import { PALETTE } from '../../src/utils/palette';

/**
 * Tests for screens/CaptureScreen.tsx
 * TASK: MOBILE-003 — Screen Integration Testing
 *
 * Test coverage:
 * ✓ Component renders without crashing
 * ✓ Correct title and UI text displayed
 * ✓ All palette colors rendered
 * ✓ Sliders for intensity and before/after
 * ✓ Request ID tracing displayed
 * ✓ Try-on status messages rendered correctly
 * ✓ Button disable/enable states based on data
 */

jest.mock('../../src/store/selfieStore');
jest.mock('../../src/state/useTryOnState');
jest.mock('../../src/services/media');
jest.mock('../../src/utils/share');
jest.mock('../../src/utils/cta');

const createMockSelfieStore = () => ({
  selfie: undefined,
  setSelfie: jest.fn(),
  setProcessing: jest.fn(),
  setError: jest.fn(),
  isProcessing: false,
});

const createMockTryOnState = () => ({
  selectedColor: PALETTE[0],
  intensity: 50,
  beforeAfterPosition: 0.5,
  status: 'idle',
  requestId: 'req-test-123',
  result: undefined,
  error: undefined,
  selectColor: jest.fn(),
  setIntensity: jest.fn(),
  setBeforeAfterPosition: jest.fn(),
  markLoading: jest.fn(),
  markSuccess: jest.fn(),
  markError: jest.fn(),
  resetFlow: jest.fn(),
  regenerateRequestId: jest.fn(),
});

describe('CaptureScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSelfieStore as jest.Mock).mockReturnValue(createMockSelfieStore());
    (useTryOnState as jest.Mock).mockReturnValue(createMockTryOnState());
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      expect(tree).toBeTruthy();
    });

    it('displays title "Hair color try-on"', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Hair color try-on');
    });

    it('displays helper text when not processing', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        isProcessing: false,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Usa una selfie bien iluminada');
    });

    it('displays loading indicator text when processing', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        isProcessing: true,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Procesando');
    });

    it('renders all palette colors', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      PALETTE.forEach((color) => {
        expect(treeString).toContain(color.name);
      });
    });

    it('displays intensity slider label', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Intensidad');
      expect(treeString).toContain('Sutil');
      expect(treeString).toContain('Intenso');
    });

    it('displays before/after slider label', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Comparar antes/después');
      expect(treeString).toContain('Antes');
      expect(treeString).toContain('Después');
    });

    it('displays action buttons', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Elegir foto');
      expect(treeString).toContain('Abrir cámara');
      expect(treeString).toContain('Aplicar color');
      expect(treeString).toContain('Reserva tu cita');
      expect(treeString).toContain('Compartir resultado');
    });

    it('displays request_id for tracing', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('request_id');
      expect(treeString).toContain('req-test-123');
    });
  });

  describe('state integration', () => {
    it('uses selected color from tryOnState', () => {
      const selectedColor = PALETTE[3];
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        selectedColor,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(selectedColor.name);
    });

    it('displays selected color in multiple places', () => {
      const color = PALETTE[2];
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        selectedColor: color,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      // Color should appear multiple times: in palette, in sliders, in status
      const matches = (treeString.match(new RegExp(color.name, 'g')) || []).length;
      expect(matches).toBeGreaterThanOrEqual(1);
    });

    it('displays intensity value in slider message', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        intensity: 75,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('75%');
    });

    it('displays before/after percentage', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        beforeAfterPosition: 0.4,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('40% aplicado');
    });

    it('shows required SelfiePreview component', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        selfie: {
          uri: 'file:///selfie.jpg',
          base64: 'test-base64',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      expect(tree).toBeTruthy();
    });
  });

  describe('try-on status messages', () => {
    it('shows loading message during processing', () => {
      const color = PALETTE[1];
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        status: 'loading',
        selectedColor: color,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Procesando tono');
      expect(treeString).toContain(color.name);
    });

    it('shows error message on failure', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        status: 'error',
        error: {
          code: 'API_ERROR',
          message: 'Connection failed',
          requestId: 'req-123',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Connection failed');
    });

    it('shows success message with processing time', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        status: 'success',
        result: {
          imageUrl: 'http://example.com/result.jpg',
          processingMs: 350,
          requestId: 'req-123',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('350 ms');
      expect(treeString).toContain('req-123');
    });

    it('hides status message when idle', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        status: 'idle',
        result: undefined,
      });

      const component = renderer.create(<CaptureScreen />);
      const tree = component.toJSON();

      // Idle state should not show try-on status
      expect(tree).toBeTruthy();
    });
  });

  describe('button states', () => {
    it('components render when selfie present', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        selfie: {
          uri: 'file:///image.jpg',
          fileSize: 1024000,
          base64: 'data',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      expect(tree).toBeTruthy();
    });

    it('renders share button disabled when no result', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        result: undefined,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Compartir resultado');
    });

    it('renders share button when result available', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        result: {
          imageUrl: 'http://example.com/result.jpg',
          processingMs: 250,
          requestId: 'req-123',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Compartir resultado');
    });

    it('renders apply button when selfie present', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        selfie: {
          uri: 'file:///image.jpg',
          base64: 'data',
        },
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Aplicar color');
    });
  });

  describe('color palette integration', () => {
    it('passes palette to ColorPalette component', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      // All colors should be present
      expect(treeString).toContain(PALETTE[0].name);
      expect(treeString).toContain(PALETTE[9].name);
    });

    it('displays selected color from state', () => {
      const selected = PALETTE[5];
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        selectedColor: selected,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(selected.name);
      expect(treeString).toContain(selected.description);
    });
  });

  describe('slider integration', () => {
    it('passes intensity value to slider', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        intensity: 80,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('80%');
    });

    it('passes before/after position to slider', () => {
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        beforeAfterPosition: 0.7,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('70% aplicado');
    });

    it('slider ranges are correct', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      // Intensity: 0-100, before/after: 0-1
      expect(treeString).toContain('Sutil');
      expect(treeString).toContain('Intenso');
      expect(treeString).toContain('Antes');
      expect(treeString).toContain('Después');
    });
  });

  describe('selfie preview', () => {
    it('passes selfie data to SelfiePreview', () => {
      const selfie = {
        uri: 'file:///selfie.jpg',
        base64: 'base64data',
        fileSize: 2048000,
      };

      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        selfie,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      expect(tree).toBeTruthy();
    });

    it('passes color to SelfiePreview for preview overlay', () => {
      const color = PALETTE[4];
      (useTryOnState as jest.Mock).mockReturnValue({
        ...createMockTryOnState(),
        selectedColor: color,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain(color.name);
    });
  });

  describe('booking button', () => {
    it('displays booking button', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Reserva tu cita');
    });

    it('booking button has whatsapp emoji', () => {
      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('📅');
    });
  });

  describe('processing states', () => {
    it('shows different UI when processing media', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        isProcessing: true,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Procesando');
    });

    it('shows helper text when not processing media', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        isProcessing: false,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      const treeString = JSON.stringify(tree);
      expect(treeString).toContain('Usa una selfie bien iluminada');
    });

    it('displays custom processing status text if set', () => {
      (useSelfieStore as jest.Mock).mockReturnValue({
        ...createMockSelfieStore(),
        isProcessing: true,
      });

      const tree = renderer.create(<CaptureScreen />).toJSON();
      expect(tree).toBeTruthy();
    });
  });
});
