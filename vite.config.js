import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replace with your GitHub repo name
const repoName = "actorgraph";

export default defineConfig({
  base: `/${repoName}/`,
  plugins: [react()],
});
