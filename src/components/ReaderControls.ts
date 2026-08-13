import type { ReadingMode } from "../types/comic";
import { createModeSwitch, updateModeSwitch } from "./ReadingModeSwitch";
import { createProgressSlider } from "./ProgressSlider";

export interface ReaderControlsOptions {
  mode: ReadingMode;
  page: number;
  totalPages: number;
  hasNext: boolean;
  onNextChapter: () => void;
  onSeek: (page: number) => void;
  onModeChange: (mode: ReadingMode) => void;
}

export interface ReaderControls {
  element: HTMLElement;
  update: (partial: Partial<Pick<ReaderControlsOptions, "mode" | "page" | "totalPages">>) => void;
}

export function createControls(options: ReaderControlsOptions): ReaderControls {
  const el = document.createElement("div");
  el.className = "reader-controls";
  el.setAttribute("role", "toolbar");
  el.setAttribute("aria-label", "阅读控制栏");

  const indicator = document.createElement("span");
  indicator.className = "reader-page-indicator";
  indicator.setAttribute("aria-live", "polite");

  const slider = createProgressSlider({
    min: 1,
    max: options.totalPages,
    value: options.page,
    onSeek: options.onSeek,
  });

  const middle = document.createElement("div");
  middle.className = "reader-controls-middle";
  middle.append(indicator, slider.element);

  const nextChapter = document.createElement("button");
  nextChapter.type = "button";
  nextChapter.className = "reader-next-chapter";
  nextChapter.textContent = "下一章";
  nextChapter.hidden = !options.hasNext;
  nextChapter.addEventListener("click", options.onNextChapter);

  const modeSwitch = createModeSwitch({
    value: options.mode,
    onChange: options.onModeChange,
  });

  el.append(middle, nextChapter, modeSwitch);

  let current: { mode: ReadingMode; page: number; totalPages: number } = {
    mode: options.mode,
    page: options.page,
    totalPages: options.totalPages,
  };

  function render(partial: Partial<typeof current> = {}) {
    current = { ...current, ...partial };

    indicator.textContent = `${current.page} / ${current.totalPages}`;
    slider.setValue(current.page);
    slider.element.max = String(current.totalPages);
    nextChapter.hidden = current.page < current.totalPages || !options.hasNext;
    updateModeSwitch(modeSwitch, current.mode);
  }

  render();
  return { element: el, update: render };
}
