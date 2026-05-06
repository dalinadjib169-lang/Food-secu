import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import cors from "cors";

const DATA_FILE = path.join(process.cwd(), "db.json");

// Initialize DB if doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ products: [], reports: [] }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    res.json(data.products);
  });

  app.post("/api/products", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const newProduct = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    data.products.push(newProduct);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.status(201).json(newProduct);
  });

  app.post("/api/products/:id/comments", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const index = data.products.findIndex((p: any) => p.id === req.params.id);
    if (index !== -1) {
      if (!data.products[index].comments) data.products[index].comments = [];
      data.products[index].comments.push({
        ...req.body,
        id: Date.now().toString(),
        createdAt: Date.now(),
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(data));
      res.json(data.products[index]);
    } else {
      res.status(404).send("Product not found");
    }
  });

  app.get("/api/reports", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    res.json(data.reports);
  });

  app.post("/api/reports", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    const newReport = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    data.reports.push(newReport);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.status(201).json(newReport);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
