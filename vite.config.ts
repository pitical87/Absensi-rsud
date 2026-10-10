import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), tailwindcss(), svgr()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("react-dom") || id.includes("/react/")) return "react";
            if (id.includes("react-router")) return "react-router";
            if (id.includes("axios")) return "axios";
            if (id.includes("react-hook-form")) return "react-hook-form";
            if (id.includes("leaflet")) return "leaflet";
            if (id.includes("react-hot-toast")) return "toast";
            if (id.includes("react-icons")) return "icons";
            return "vendor";
          },
        },
      },
    },
  };
});
