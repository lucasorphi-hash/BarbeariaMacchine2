import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Banco de Dados
const url = process.env.TURSO_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

// Se houver TURSO_URL, usa Turso. Se não, usa SQLite local (ideal para Railway com Volumes)
const isTurso = url.startsWith("libsql://");
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "barbearia.db")
  : path.join(__dirname, "..", "barbearia.db");

const client = createClient({
  url: isTurso ? url : `file:${dbPath}`,
  authToken: authToken,
});

// Inicialização do banco de dados
async function initDb() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

initDb();

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const result = await client.execute("SELECT * FROM appointments ORDER BY date DESC, time DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/debug", async (req, res) => {
    try {
      const countResult = await client.execute("SELECT COUNT(*) as count FROM appointments");
      const lastResult = await client.execute("SELECT * FROM appointments ORDER BY id DESC LIMIT 1");
      res.json({ 
        status: "ok", 
        mode: isTurso ? "cloud" : "local",
        total_appointments: countResult.rows[0]?.count || 0,
        last_appointment: lastResult.rows[0] || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota explícita para a logo para evitar erros de cache/static
  app.get("/logo.jpg", (req, res) => {
    const publicPath = path.join(__dirname, "..", "public", "logo.jpg");
    const distPath = path.join(__dirname, "..", "dist", "logo.jpg");
    
    if (fs.existsSync(publicPath)) {
      res.sendFile(publicPath);
    } else if (fs.existsSync(distPath)) {
      res.sendFile(distPath);
    } else {
      console.error("Logo not found at:", { publicPath, distPath });
      res.status(404).send("Logo not found");
    }
  });

  app.post("/api/appointments", async (req, res) => {
    const { customer_name, customer_phone, service, date, time, extra_time } = req.body;
    
    if (!customer_name || !customer_phone || !service || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Check if slots are already taken
      const timesToCheck = [time];
      if (extra_time) timesToCheck.push(extra_time);

      for (const t of timesToCheck) {
        const existing = await client.execute({
          sql: "SELECT id FROM appointments WHERE date = ? AND time = ?",
          args: [date, t]
        });
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: `Horário ${t} já reservado` });
        }
      }

      // Insert slots
      await client.execute({
        sql: "INSERT INTO appointments (customer_name, customer_phone, service, date, time) VALUES (?, ?, ?, ?, ?)",
        args: [customer_name, customer_phone, service, date, time]
      });

      if (extra_time) {
        await client.execute({
          sql: "INSERT INTO appointments (customer_name, customer_phone, service, date, time) VALUES (?, ?, ?, ?, ?)",
          args: [customer_name, customer_phone, `${service} (Parte 2)`, date, extra_time]
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving appointment:", error);
      res.status(400).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.execute({
        sql: "DELETE FROM appointments WHERE id = ?",
        args: [id]
      });
      if (result.rowsAffected > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Appointment not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
