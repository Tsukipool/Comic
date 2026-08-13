import type { ComicEntry } from "./comics";
import { getAllComics } from "./comics";
import { tagSlug, tagNameFromSlug } from "./slug";

export interface TagInfo {
  name: string;
  slug: string;
  count: number;
}

export async function getAllTags(): Promise<TagInfo[]> {
  const comics = await getAllComics();
  const counts = new Map<string, number>();
  for (const comic of comics) {
    for (const tag of comic.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: tagSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh"));
}

export async function getComicsByTagName(tagName: string): Promise<ComicEntry[]> {
  const comics = await getAllComics();
  return comics.filter((comic) => comic.data.tags.includes(tagName));
}

export async function getComicsByTagSlug(slug: string): Promise<ComicEntry[]> {
  const name = tagNameFromSlug(slug);
  if (!name) return [];
  return getComicsByTagName(name);
}
