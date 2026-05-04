import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: "/warhammer-minus/",
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
});
