import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import * as fs from "fs";
import * as path from "path";

// Load .dev.vars for local development
if (process.env.NODE_ENV !== "production") {
  const devVarsPath = path.resolve(process.cwd(), ".dev.vars");
  if (fs.existsSync(devVarsPath)) {
    const devVars = fs.readFileSync(devVarsPath, "utf-8");
    devVars.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join("=").trim();
        }
      }
    });
  }
}

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
  },
  optimizeDeps: {
    include: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/charts",
      "@mantine/notifications",
      "@mantine/nprogress",
      "@tabler/icons-react",
    ],
  },
});
