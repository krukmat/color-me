import { PALETTE, findPaletteColor } from "../src/utils/palette";

describe("palette definition", () => {
  it("contains 10 unique colors", () => {
    expect(PALETTE).toHaveLength(10);
    const uniqueNames = new Set(PALETTE.map((color) => color.name));
    expect(uniqueNames.size).toBe(10);
  });

  it("allows lookup by name", () => {
    const target = PALETTE[3];
    expect(findPaletteColor(target.name)?.hex).toBe(target.hex);
  });

  it("uses valid hex codes", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    PALETTE.forEach((color) => {
      expect(hexRegex.test(color.hex)).toBe(true);
    });
  });
});
