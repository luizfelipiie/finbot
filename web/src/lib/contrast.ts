/** WCAG 2.x relative luminance and contrast ratio for #rrggbb colors. */
function luminance(hex: string): number {
  const digits = /^#([0-9a-f]{6})$/i.exec(hex)?.[1]
  if (!digits) throw new RangeError(`Expected #rrggbb, got ${hex}`)
  const channel = (offset: number) => {
    const value = parseInt(digits.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
