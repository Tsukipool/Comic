export type Theme = "light" | "dark";

export interface SiteConfig {
  title: string;
  footer: string;
  defaultTheme: Theme;
  fontFamily: string;
}

export const siteConfig: SiteConfig = {
  title: "星之轨 - Tsukipool",
  footer: "星之轨（Tsukipool）· 月色真美，风也温柔",
  defaultTheme: "dark",
  fontFamily:
    "'Noto Serif SC Variable', 'Noto Serif SC', 'Source Han Serif SC', 'Source Han Serif CN', 'Songti SC', 'SimSun', serif",
};
