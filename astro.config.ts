import { defineConfig } from "astro/config";
import sanitize, { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": ["className", "id"],
  },
};

export default defineConfig({
  output: "static",
  site: "https://comic.tsukipool.cc",
  markdown: {
    rehypePlugins: [[sanitize, sanitizeSchema]],
  },
});
