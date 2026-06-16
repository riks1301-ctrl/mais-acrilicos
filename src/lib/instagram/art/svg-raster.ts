/** Rasteriza SVG com texto legível no Linux/serverless (sharp/librsvg costuma omitir fontes). */
export async function rasterizeSvgToPng(svg: string, width: number, height: number): Promise<Buffer> {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "DejaVu Sans",
    },
  });
  const rendered = resvg.render();
  const png = Buffer.from(rendered.asPng());

  if (rendered.height === height && rendered.width === width) {
    return png;
  }

  const sharp = (await import("sharp")).default;
  return sharp(png).resize(width, height, { fit: "fill" }).png().toBuffer();
}
