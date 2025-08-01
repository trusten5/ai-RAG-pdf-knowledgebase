// utils/textHelpers.ts

export function normalizeHeader(header: string): string {
  return header
    .replace(/^##\s+/, "")
    .replace(/['’""]/g, "")
    .replace(/[\s\-–—]+/g, " ")
    .trim()
    .toLowerCase();
}

export function replaceSection(original: string, newSection: string, debugLabel: string = ""): string {
  const headerMatch = newSection.match(/^##\s+.+/m);
  if (!headerMatch) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${debugLabel}] No header found in newSection, appending as new section.`);
    }
    return original.trim() + "\n\n" + newSection.trim();
  }

  const newHeaderNorm = normalizeHeader(headerMatch[0]);
  const headerRegex = /^##\s+.+/gm;
  let match;
  let lastIndex = -1;
  let replaceStart = -1;
  let replaceEnd = -1;

  while ((match = headerRegex.exec(original)) !== null) {
    const thisHeaderNorm = normalizeHeader(match[0]);
    if (thisHeaderNorm === newHeaderNorm) {
      lastIndex = match.index;
    }
  }

  if (lastIndex !== -1) {
    const after = original.slice(lastIndex + 1);
    const nextHeader = after.search(/^##\s+/m);
    replaceStart = lastIndex;
    replaceEnd = nextHeader === -1 ? original.length : lastIndex + 1 + nextHeader;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[${debugLabel}] Matched section at [${replaceStart}, ${replaceEnd}]. Replacing.`);
    }

    return (
      original.slice(0, replaceStart) +
      newSection.trim() +
      original.slice(replaceEnd)
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[${debugLabel}] No matching header found, appending new section.`);
    console.log(`[${debugLabel}] Original:`, original);
    console.log(`[${debugLabel}] New Section:`, newSection);
  }
  return original.trim() + "\n\n" + newSection.trim();
}

export function replaceBulletsSection(original: string, newSection: string): string {
  return replaceSection(original, newSection, "SLIDE BULLETS");
}
