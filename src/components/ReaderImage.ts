export interface ReaderImageOptions {
  src: string;
  alt: string;
  priority?: boolean;
  onLoad?: () => void;
}

export interface ReaderImage {
  element: HTMLElement;
}

export function createReaderImage(options: ReaderImageOptions): ReaderImage {
  const wrap = document.createElement("figure");
  wrap.className = "reader-page";

  const img = document.createElement("img");
  img.src = options.src;
  img.alt = options.alt;
  img.loading = options.priority ? "eager" : "lazy";
  img.decoding = "async";
  img.width = 800;
  img.height = 1200;
  img.addEventListener("load", () => {
    wrap.classList.add("reader-page--loaded");
    options.onLoad?.();
  });
  img.addEventListener("error", () => {
    wrap.classList.add("reader-page--error");
  });

  const error = document.createElement("div");
  error.className = "reader-page-error";
  error.setAttribute("aria-live", "polite");

  const text = document.createElement("p");
  text.textContent = "图片加载失败";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "reader-page-retry";
  retry.textContent = "重试";
  retry.addEventListener("click", () => {
    wrap.classList.remove("reader-page--error");
    img.src = options.src;
  });

  error.append(text, retry);
  wrap.append(img, error);
  return { element: wrap };
}
