import type { ReadingMode } from "../types/comic";

const MODES: { value: ReadingMode; label: string }[] = [
  { value: "ltr", label: "左→右" },
  { value: "rtl", label: "右→左" },
  { value: "vertical", label: "上→下" },
];

export function isReadingMode(value: unknown): value is ReadingMode {
  return value === "ltr" || value === "rtl" || value === "vertical";
}

export interface ModeSwitchOptions {
  value: ReadingMode;
  onChange: (mode: ReadingMode) => void;
}

export function createModeSwitch(options: ModeSwitchOptions): HTMLElement {
  const group = document.createElement("div");
  group.className = "reader-modes";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", "阅读模式");

  for (const mode of MODES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reader-mode-btn";
    button.dataset.mode = mode.value;
    button.setAttribute("role", "radio");
    button.textContent = mode.label;
    button.addEventListener("click", () => options.onChange(mode.value));
    group.appendChild(button);
  }

  updateModeSwitch(group, options.value);
  return group;
}

export function updateModeSwitch(group: HTMLElement, value: ReadingMode): void {
  for (const button of group.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
    button.setAttribute("aria-checked", String(button.dataset.mode === value));
  }
}
