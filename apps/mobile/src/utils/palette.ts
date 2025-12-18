export interface PaletteColor {
  name: string;
  hex: string;
  description: string;
}

export const PALETTE: PaletteColor[] = [
  { name: "Midnight Espresso", hex: "#2C1B2F", description: "Neutral profundo para contraste dramático." },
  { name: "Copper Bloom", hex: "#A15C3E", description: "Cobre cálido con destellos naranjas." },
  { name: "Rosewood Fade", hex: "#7E3C3C", description: "Borgoña frambuesa para tonos ricos." },
  { name: "Saffron Glaze", hex: "#D9902D", description: "Cobre brillante que mantiene calidez." },
  { name: "Sunlit Amber", hex: "#F4B55E", description: "Oro miel metálico y suave." },
  { name: "Forest Veil", hex: "#375A40", description: "Verde bosque atenuado para balance edgy." },
  { name: "Lilac Mist", hex: "#A78EBB", description: "Lavanda polvosa para looks juguetones." },
  { name: "Soft Slate", hex: "#54616F", description: "Ash frío que neutraliza calidez." },
  { name: "Blush Garnet", hex: "#94425E", description: "Rojo rosado profundo para acabados audaces." },
  { name: "Champagne Frost", hex: "#BFAF99", description: "Beige pálido con reflejos fríos." },
];

export const MIN_INTENSITY = 0;
export const MAX_INTENSITY = 100;
export const INTENSITY_STEP = 5;
export const DEFAULT_INTENSITY = 50;

export const findPaletteColor = (name: string): PaletteColor | undefined =>
  PALETTE.find((color) => color.name === name);
