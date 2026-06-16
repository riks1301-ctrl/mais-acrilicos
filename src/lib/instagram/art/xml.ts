/** Escapa texto para nós XML/SVG (evita EntityRef em legendas com &, <, etc.). */
export function escXml(s: string): string {
  return s
    .replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Escapa valores em atributos SVG (href, fill, etc.). */
export function escXmlAttr(s: string): string {
  return escXml(s);
}
