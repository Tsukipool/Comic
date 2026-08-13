import { defineCollection, z } from "astro:content";

const mediaUrl = z.string().refine(
  (value) => /^(https?:\/\/|\/)/.test(value),
  "媒体 URL 只允许 https://, http:// 或以 / 开头的本地路径"
);

const comicSchema = z.object({
  title: z.string().min(1, "缺少 title"),
  cover: mediaUrl,
  artist: z.string().min(1, "缺少 artist"),
  tags: z.array(z.string().min(1, "标签不能为空")).min(1, "缺少 tags"),
  description: z.string().optional(),
});

export const collections = {
  comics: defineCollection({
    type: "content",
    schema: comicSchema,
  }),
};
