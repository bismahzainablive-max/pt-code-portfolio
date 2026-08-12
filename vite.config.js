import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: "base" must match your GitHub repo name exactly before deploying,
// e.g. if your repo is github.com/yourname/pt-code-portfolio, base stays "/pt-code-portfolio/".
// If you rename the repo, or deploy to a username.github.io root repo, update this to match
// (root repos use base: "/").
export default defineConfig({
  plugins: [react()],
  base: "/pt-code-portfolio/",
});
