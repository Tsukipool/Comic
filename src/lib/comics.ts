import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";
import type { Chapter, ComicImage } from "../types/comic";
import { tagSlug } from "./slug";

export type ComicEntry = CollectionEntry<"comics">;

const COMIC_INDEX = new Map<string, ComicEntry>();
const CHAPTER_INDEX = new Map<string, Chapter[]>();

function contentDirPath(): string {
  return join(process.cwd(), "src", "content", "comics");
}

function parseFrontmatterKey(raw: string, key: string): string | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const line = match[1].split(/\r?\n/).find((l) => new RegExp(`^\\s*${key}\\s*:`).test(l));
  if (!line) return null;
  const value = line.replace(new RegExp(`^\\s*${key}\\s*:\\s*`), "").trim();
  return value.replace(/^["']|["']$/g, "");
}

export function assertAllHaveSlug(entries: ComicEntry[]): void {
  const dir = contentDirPath();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const raw = readFileSync(join(dir, file), "utf-8");
    const slug = parseFrontmatterKey(raw, "slug");
    if (!slug) {
      throw new Error(`缺少 slug: ${file} 的 Frontmatter 必须包含 slug 字段`);
    }
    const fileName = file.replace(/\.md$/, "");
    if (slug !== fileName) {
      throw new Error(`slug 不一致: ${file} 中的 slug "${slug}" 必须与文件名 "${fileName}" 一致`);
    }
  }
}

export function assertNoDuplicateSlugs(entries: ComicEntry[]): void {
  const seen = new Map<string, ComicEntry>();
  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      throw new Error(
        `Comic slug 重复: "${entry.slug}" 同时出现在 ${seen.get(entry.slug)!.id} 和 ${entry.id}`
      );
    }
    seen.set(entry.slug, entry);
  }
}

export function assertNoDuplicateChapterIds(entry: ComicEntry, chapters: Chapter[]): void {
  const seen = new Set<string>();
  for (const chapter of chapters) {
    if (seen.has(chapter.id)) {
      throw new Error(`Comic "${entry.slug}" 的章节 ID 重复: "${chapter.id}"`);
    }
    seen.add(chapter.id);
  }
}

export function validateAll(entries: ComicEntry[]): void {
  assertAllHaveSlug(entries);
  assertNoDuplicateSlugs(entries);
}

export function comicMediaBase(slug: string): string {
  return `/media/comics/${slug}/`;
}

function resolveImageSrc(src: string, baseUrl: string): string {
  if (/^(https?:\/\/|\/)/.test(src)) return src;
  return baseUrl + src.replace(/^\.\//, "").replace(/^\.\.\//, "");
}

function folderOf(src: string): string | null {
  if (!src.startsWith("/")) return null;
  const parts = src.slice(1).split("/");
  if (parts.length < 2) return null;
  return parts[parts.length - 2];
}

function extractImages(content: string[], baseUrl: string): ComicImage[] {
  const images: ComicImage[] = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const line of content) {
    for (const match of line.matchAll(re)) {
      images.push({
        src: resolveImageSrc(match[2], baseUrl),
        alt: match[1] || undefined,
      });
    }
  }
  return images;
}

export function parseChapters(entry: ComicEntry): Chapter[] {
  const cached = CHAPTER_INDEX.get(entry.slug);
  if (cached) return cached;

  const baseUrl = comicMediaBase(entry.slug);
  const lines = entry.body.split(/\r?\n/);

  const sections: { heading?: string; content: string[] }[] = [];
  let current: { heading?: string; content: string[] } | null = null;

  for (const line of lines) {
    const heading = line.match(/^#\s+(.+)$/);
    if (heading) {
      current = { heading: heading[1].trim(), content: [] };
      sections.push(current);
    } else if (current) {
      current.content.push(line);
    }
  }

  const chapters: Chapter[] = [];
  const usedIds = new Set<string>();

  sections.forEach((section, index) => {
    const images = extractImages(section.content, baseUrl);
    if (images.length === 0) return;

    let id: string | null = folderOf(images[0].src);
    if (!id) id = section.heading ? tagSlug(section.heading) : null;
    if (!id) id = `chapter-${String(index + 1).padStart(2, "0")}`;

    let uniqueId = id;
    let suffix = 2;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${id}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(uniqueId);

    chapters.push({
      id: uniqueId,
      title: section.heading ?? `第 ${index + 1} 章`,
      images,
    });
  });

  if (chapters.length === 0) {
    throw new Error(`Comic "${entry.slug}" 的正文必须包含至少一个章节（# 标题 + 图片）`);
  }

  assertNoDuplicateChapterIds(entry, chapters);
  CHAPTER_INDEX.set(entry.slug, chapters);
  return chapters;
}

export async function getAllComics(): Promise<ComicEntry[]> {
  if (COMIC_INDEX.size > 0) return [...COMIC_INDEX.values()];

  const entries = (await getCollection("comics")).sort((a, b) =>
    a.data.title.localeCompare(b.data.title, "zh")
  );

  validateAll(entries);

  for (const entry of entries) {
    COMIC_INDEX.set(entry.slug, entry);
  }
  return entries;
}

export async function getComic(slug: string): Promise<ComicEntry | undefined> {
  await getAllComics();
  return COMIC_INDEX.get(slug);
}

export function getChapter(entry: ComicEntry, chapterId: string): Chapter | undefined {
  return parseChapters(entry).find((chapter) => chapter.id === chapterId);
}

export function getChapterIndex(entry: ComicEntry, chapterId: string): number {
  return parseChapters(entry).findIndex((chapter) => chapter.id === chapterId);
}
