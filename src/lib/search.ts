import type { ComicEntry } from "./comics";
import { getAllComics, parseChapters } from "./comics";

export interface SearchIndexItem {
  slug: string;
  title: string;
  tags: string[];
  artist: string;
  description: string;
  cover: string;
  chapterCount: number;
}

export async function buildSearchIndex(): Promise<SearchIndexItem[]> {
  const comics = await getAllComics();
  return comics.map((comic) => ({
    slug: comic.slug,
    title: comic.data.title,
    tags: comic.data.tags,
    artist: comic.data.artist,
    description: comic.data.description ?? "",
    cover: comic.data.cover,
    chapterCount: parseChapters(comic).length,
  }));
}

export function searchComics(index: SearchIndexItem[], query: string): SearchIndexItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return index.filter((item) => {
    const haystack = [item.title, item.description, item.artist, ...item.tags]
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}
