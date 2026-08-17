# 极简漫画站

基于 Astro 的极简漫画网站。Markdown 管理漫画数据，图片走本地 / 外部 URL，静态生成优先。

## 快速开始

```bash
pnpm install
pnpm dev       # 开发（已带 --host，局域网可访问）
pnpm build     # 构建
pnpm preview   # 预览构建产物（已带 --host）
pnpm check     # 类型检查
```

包管理器使用 **pnpm**（`packageManager: pnpm@11`）。依赖构建脚本（esbuild / sharp）已在 `pnpm-workspace.yaml` 的 `allowBuilds` 中放行。

## 内容发布

1. 准备漫画图片（章节页按 2:3 竖版最佳），上传到 `public/media/comics/<slug>/` 或外部 CDN
2. 在 `src/content/comics/` 创建 Markdown（文件名即 slug，必须与 Frontmatter 中的 slug 一致）：

```md
---
title: "示例漫画"
slug: "example"
cover: "/media/comics/example/cover.webp"
artist: "画师名称"
tags:
  - 冒险
  - 奇幻
description: "漫画简介"
---

# 第 1 章：启程

![001](/media/comics/example/chapter-01/001.jpg)
![002](/media/comics/example/chapter-01/002.jpg)

# 第 2 章：星海

![001](/media/comics/example/chapter-02/001.jpg)
```

3. 构建：`npm run build`。缺少必填字段、slug 重复、章节为空、非法图片 URL 会在构建阶段报错。

章节由正文中的 `# 标题` 与 `![图片](地址)` 自动解析：

- 章节 ID 取第一张本地图片所在文件夹名（如 `chapter-01`），外部平铺图片则取标题 slug
- 图片支持本地路径（`/media/...`）或外部 URL（`https://...`）
- 章节顺序即正文顺序，读完一章自动进入下一章

## 阅读器

支持三种阅读模式，可在阅读器底部控制栏随时切换：

- **左→右（ltr）**：单页显示，点击右侧区域 / 按 `→` / 左滑 下一页
- **右→左（rtl）**：单页显示，点击左侧区域 / 按 `←` / 左滑 下一页
- **上→下（vertical）**：图片纵向排列，正常滚动阅读

控制栏提供上一页 / 下一页、当前页 / 总页数、进度滑块（拖动立即跳页）与「下一章」。

到达章节最后一页时停留约 10 秒，显示「即将进入下一章」提示（可取消）；点击「下一章」立即进入。最后一章不会继续跳转。

阅读进度（章节 / 页数 / 阅读模式）保存在 `localStorage`，重新打开时自动恢复。

## 站点配置

`src/site.config.ts` 集中管理全站配置：

```ts
export const siteConfig = {
  title: "极简漫画站", // 站名（Header Logo / 页脚）
  footer: "极简漫画站", // 页脚站名（末尾会自动追加指向 https://astro.build/ 的 Astro 链接）
  defaultTheme: "dark", // 默认主题：未手动选择时使用 dark（暗色），可改为 "light"
  fontFamily: "'Noto Serif SC Variable', 'Source Han Serif SC', ...", // 全局字体（思源宋体）
};
```

- 修改 `defaultTheme` 即可切换默认亮色/暗色模式
- 修改 `fontFamily` 即可替换全局字体
- 思源宋体（Noto Serif SC Variable）通过 npm 包 `@fontsource-variable/noto-serif-sc` 自托管，构建后按 unicode-range 分片，浏览器按需加载

## 页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页漫画列表 |
| `/tag/[tag]` | 标签页 |
| `/search?q=xxx` | 搜索页（客户端索引搜索，支持名称 / 标签 / 画师） |
| `/comic/[slug]` | 漫画详情页（封面 / 画师 / 标签 / 简介 / 章节列表） |
| `/comic/[slug]/[chapter]` | 阅读器 |
| `/404` | 内容不存在 |

## 媒体约定

- 封面：`jpg / jpeg / png / webp / avif`，本地或外部 URL，推荐 2:3 WebP / AVIF
- 章节图片：推荐竖版（2:3 左右），本地路径放 `public/media/comics/<slug>/` 或直接使用外部 URL
- 大型图片不要提交到 Git，可放在 CDN / 对象存储 / Nginx 静态目录

## 项目结构

```
src/
├── components/   # Header, ComicCard, ComicGrid, ComicMeta, ChapterList,
│                 # ComicReader（阅读器）+ ReaderControls / ProgressSlider /
│                 # ReadingModeSwitch / ReaderImage 四个纯 TS 子模块
├── content/comics/  # 漫画 Markdown
├── layouts/
├── lib/          # comics.ts（含 Markdown → 章节解析）, tags.ts, search.ts, slug.ts
├── pages/        # 首页 / 标签 / 搜索 / 详情 / 阅读器 / 404
├── styles/
└── types/
```
