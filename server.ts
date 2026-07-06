import app from "./server/app.js";
import { createServer as createViteServer } from "vite";
import express from "express";
import path from "path";

const PORT = 3000;

async function initializeApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with active Vite routing...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build assets in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  initializeApp().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
