import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Do not hardcode the port or HMR host so Vite will automatically
    // use the actual runtime port and the client will connect to the
    // correct WebSocket address (avoids mismatches when the default
    // port is occupied and Vite falls back to another port).
    host: "localhost",
  },
});