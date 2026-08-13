export type ReadingMode = "ltr" | "rtl" | "vertical";

export interface ComicImage {
  src: string;
  alt?: string;
}

export interface Chapter {
  id: string;
  title: string;
  images: ComicImage[];
}

export interface Tag {
  name: string;
  slug: string;
}
