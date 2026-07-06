import app from "./api/_app.js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = process.env.PORT || 3000;

async function start() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: {
                middlewareMode: true
            }
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, () => {
        console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
    });
}

if (!process.env.VERCEL) {
    start().catch((err) => {
        console.error("Failed to start server:", err);
    });
}
