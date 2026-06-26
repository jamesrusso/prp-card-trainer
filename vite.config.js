import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Pin the dev port so it matches the Supabase Redirect URL (http://localhost:5173).
  server: { port: 5173, strictPort: true },
});
