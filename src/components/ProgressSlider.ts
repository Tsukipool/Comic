export interface ProgressSliderOptions {
  min: number;
  max: number;
  value: number;
  onSeek: (page: number) => void;
  ariaLabel?: string;
}

export interface ProgressSlider {
  element: HTMLInputElement;
  setValue: (value: number) => void;
}

export function createProgressSlider(options: ProgressSliderOptions): ProgressSlider {
  const input = document.createElement("input");
  input.type = "range";
  input.className = "reader-slider";
  input.min = String(options.min);
  input.max = String(options.max);
  input.value = String(options.value);
  input.setAttribute("aria-label", options.ariaLabel ?? "阅读进度");

  input.addEventListener("input", () => {
    options.onSeek(Number(input.value));
  });

  return {
    element: input,
    setValue: (value: number) => {
      input.value = String(value);
    },
  };
}
