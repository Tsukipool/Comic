import type { ComicImage, ReadingMode } from "../types/comic";
import { createControls } from "./ReaderControls";
import { createReaderImage } from "./ReaderImage";
import { isReadingMode } from "./ReadingModeSwitch";

export interface ReaderData {
  comicSlug: string;
  chapterId: string;
  chapterTitle: string;
  images: ComicImage[];
  nextChapter: { id: string; title: string } | null;
}

const STORAGE_PREFIX = "comic-progress:";
const AUTO_NEXT_DELAY = 10000;
const SWIPE_THRESHOLD = 40;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadProgress(comicSlug: string): { chapter: string; page: number; mode: ReadingMode } | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + comicSlug);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return {
      chapter: typeof data.chapter === "string" ? data.chapter : "",
      page: typeof data.page === "number" && data.page >= 1 ? Math.floor(data.page) : 1,
      mode: isReadingMode(data.mode) ? data.mode : "ltr",
    };
  } catch {
    return null;
  }
}

export function createReader(root: HTMLElement, data: ReaderData): void {
  const viewport = root.querySelector<HTMLElement>("[data-reader-viewport]")!;
  const controlsEl = root.querySelector<HTMLElement>("[data-reader-controls]")!;
  const hintEl = root.querySelector<HTMLElement>("[data-reader-hint]")!;
  const hintTitleEl = root.querySelector<HTMLElement>("[data-reader-hint-title]")!;
  const hintCancelEl = root.querySelector<HTMLButtonElement>("[data-reader-hint-cancel]")!;

  const totalPages = data.images.length;
  const saved = loadProgress(data.comicSlug);

  let mode: ReadingMode = saved?.mode ?? "ltr";
  let page = saved && saved.chapter === data.chapterId ? clamp(saved.page, 1, totalPages) : 1;
  let timer: number | null = null;
  let hintVisible = false;
  let verticalObserver: IntersectionObserver | null = null;
  let verticalDisarmed = false;

  let controls: ReturnType<typeof createControls>;

  function saveProgress(): void {
    try {
      localStorage.setItem(
        STORAGE_PREFIX + data.comicSlug,
        JSON.stringify({ chapter: data.chapterId, page, mode })
      );
    } catch {
      /* ignore */
    }
  }

  function pageAlt(pageIndex: number): string {
    return `${data.chapterTitle}，第 ${pageIndex} 页`;
  }

  function scrollToTop(): void {
    window.scrollTo({ top: 0 });
  }

  function renderViewport(): void {
    verticalObserver?.disconnect();
    verticalObserver = null;
    viewport.innerHTML = "";
    viewport.classList.remove("reader-viewport--single", "reader-viewport--vertical");
    viewport.classList.add(
      mode === "vertical" ? "reader-viewport--vertical" : "reader-viewport--single"
    );
    verticalDisarmed = false;

    if (mode === "vertical") {
      data.images.forEach((image, index) => {
        const { element } = createReaderImage({
          src: image.src,
          alt: pageAlt(index + 1),
          priority: index < 2,
        });
        viewport.appendChild(element);
      });
      armVerticalAutoNext();
      return;
    }

    const { element } = createReaderImage({
      src: data.images[page - 1].src,
      alt: pageAlt(page),
      priority: true,
    });
    viewport.appendChild(element);

    if (page < totalPages) {
      const { element: nextElement } = createReaderImage({
        src: data.images[page].src,
        alt: pageAlt(page + 1),
      });
      nextElement.classList.add("reader-page--hidden");
      viewport.appendChild(nextElement);
    }
  }

  function armVerticalAutoNext(): void {
    if (!data.nextChapter || verticalDisarmed || verticalObserver) return;
    const last = viewport.lastElementChild;
    if (!last) return;

    verticalObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) showHint();
      },
      { rootMargin: "0px 0px -30% 0px" }
    );
    verticalObserver.observe(last);
  }

  function verticalCurrentPage(): number {
    const pages = viewport.querySelectorAll<HTMLElement>(".reader-page");
    if (pages.length === 0) return 1;
    const center = window.innerHeight * 0.5;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].getBoundingClientRect().bottom >= center) return i + 1;
    }
    return pages.length;
  }

  function updateIndicator(nextPage: number): void {
    page = nextPage;
    controls.update({ page });
    saveProgress();
  }

  function showHint(): void {
    if (hintVisible || !data.nextChapter) return;
    hintVisible = true;
    hintTitleEl.textContent = data.nextChapter.title;
    hintEl.hidden = false;
    timer = window.setTimeout(() => {
      timer = null;
      goNextChapter();
    }, AUTO_NEXT_DELAY);
  }

  function clearHint(): void {
    hintVisible = false;
    hintEl.hidden = true;
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function goNextChapter(): void {
    if (!data.nextChapter) return;
    window.location.href = `/comic/${data.comicSlug}/${data.nextChapter.id}`;
  }

  function setPage(nextPage: number): void {
    const target = clamp(nextPage, 1, totalPages);
    if (target === page) return;
    page = target;
    saveProgress();
    renderViewport();
    controls.update({ page });
    if (page === totalPages) {
      showHint();
    } else {
      clearHint();
    }
    if (mode !== "vertical") scrollToTop();
  }

  function next(): void {
    if (page < totalPages) {
      setPage(page + 1);
    } else if (data.nextChapter) {
      goNextChapter();
    }
  }

  function prev(): void {
    if (page > 1) setPage(page - 1);
  }

  function setMode(nextMode: ReadingMode): void {
    if (nextMode === mode) return;
    mode = nextMode;
    saveProgress();
    clearHint();
    renderViewport();
    controls.update({ mode });
    if (mode !== "vertical") scrollToTop();
  }

  function seek(target: number): void {
    setPage(target);
    if (mode === "vertical") {
      const pages = viewport.querySelectorAll<HTMLElement>(".reader-page");
      const targetEl = pages[target - 1] ?? viewport.lastElementChild;
      targetEl?.scrollIntoView({ block: "start" });
    }
  }

  controls = createControls({
    mode,
    page,
    totalPages,
    hasNext: Boolean(data.nextChapter),
    onNextChapter: goNextChapter,
    onSeek: seek,
    onModeChange: setMode,
  });
  controlsEl.appendChild(controls.element);

  viewport.addEventListener("click", (event) => {
    if (mode === "vertical") return;
    const rect = viewport.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const nextZone = mode === "ltr" ? x > 2 / 3 : x < 1 / 3;
    const prevZone = mode === "ltr" ? x < 1 / 3 : x > 2 / 3;
    if (nextZone) {
      next();
    } else if (prevZone) {
      prev();
    }
  });

  let touchX = 0;
  let touchY = 0;
  viewport.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      touchX = touch.clientX;
      touchY = touch.clientY;
    },
    { passive: true }
  );
  viewport.addEventListener(
    "touchend",
    (event) => {
      if (mode === "vertical") return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchX;
      const dy = touch.clientY - touchY;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          next();
        } else {
          prev();
        }
      }
    },
    { passive: true }
  );

  window.addEventListener("keydown", (event) => {
    if ((event.target as HTMLElement | null)?.closest?.("input")) return;
    if (mode === "vertical") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (mode === "ltr") {
        next();
      } else {
        prev();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (mode === "ltr") {
        prev();
      } else {
        next();
      }
    }
  });

  hintCancelEl.addEventListener("click", () => {
    clearHint();
    if (mode === "vertical") {
      verticalDisarmed = true;
      verticalObserver?.disconnect();
      verticalObserver = null;
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (mode !== "vertical") return;
      const current = verticalCurrentPage();
      if (current !== page) updateIndicator(current);
    },
    { passive: true }
  );

  renderViewport();
  controls.update({ mode, page });

  if (page === totalPages) {
    if (mode === "vertical") {
      armVerticalAutoNext();
    } else {
      showHint();
    }
  }
}
