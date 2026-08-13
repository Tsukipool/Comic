const TAG_SLUG_MAP: Record<string, string> = {
  冒险: "adventure",
  奇幻: "fantasy",
  治愈: "healing",
  日常: "slice-of-life",
  热血: "action",
  悬疑: "mystery",
  科幻: "scifi",
  神话: "myth",
  武侠: "wuxia",
  校园: "campus",
  惊悚: "horror",
  温馨: "warm",
  民间传说: "folklore",
  历史: "history",
  恋爱: "romance",
};

const SLUG_TAG_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TAG_SLUG_MAP).map(([name, slug]) => [slug, name])
);

export function isAsciiSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

export function tagSlug(name: string): string {
  const trimmed = name.trim();
  if (isAsciiSlug(trimmed)) return trimmed;
  const mapped = TAG_SLUG_MAP[trimmed];
  if (mapped) return mapped;
  let result = "";
  for (const char of trimmed) {
    if (isAsciiSlug(char)) {
      result += char.toLowerCase();
    } else {
      result += char
        .codePointAt(0)!
        .toString(16)
        .padStart(4, "0");
    }
  }
  return result || "tag";
}

export function tagNameFromSlug(slug: string): string | undefined {
  if (SLUG_TAG_MAP[slug]) return SLUG_TAG_MAP[slug];
  return slug;
}
