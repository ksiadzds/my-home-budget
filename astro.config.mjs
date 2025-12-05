// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // MSW jest używany tylko w testach, wykluczamy z pre-bundlingu
      exclude: ["msw", "@mswjs/interceptors"],
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
