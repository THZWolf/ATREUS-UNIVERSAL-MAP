import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // NASA Proxy Route to bypass CORS
  app.get("/api/nasa/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const query = req.query.query as string;
      const format = req.query.format as string;
      
      let nasaUrl = "";
      
      if (type === "stellar") {
        nasaUrl = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(query)}&format=${format}`;
      } else if (type === "neo") {
        // Near Earth Objects
        nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-01&api_key=DEMO_KEY`;
      }
      
      if (!nasaUrl) return res.status(400).json({ error: "Invalid stream type" });

      const response = await fetch(nasaUrl);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`NASA API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "NASA API Error", details: errorText.substring(0, 100) });
      }
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const textData = await response.text();
        // If it's not JSON but we expected JSON (like from TAP), it might be an error page or CSV
        try {
          // Attempt to parse just in case content-type is missing but it is JSON
          const data = JSON.parse(textData);
          res.json(data);
        } catch (e) {
          console.warn("NASA response is not JSON:", textData.substring(0, 100));
          res.status(500).json({ error: "NASA response format mismatch", preview: textData.substring(0, 100) });
        }
      }
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Blackzone / Deep Network Simulation Endpoint
  app.get("/api/blackzone", (req, res) => {
    const nodes = Array.from({ length: 20 }).map((_, i) => ({
      id: `node-${i}`,
      latency: Math.random() * 100,
      protocol: ["AES-Q", "RSA-X", "SHADOW-V2"][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.1 ? "ENCRYPTED" : "INTERCEPTED",
      depth: Math.floor(Math.random() * 10)
    }));
    res.json({ nodes, timestamp: Date.now() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
