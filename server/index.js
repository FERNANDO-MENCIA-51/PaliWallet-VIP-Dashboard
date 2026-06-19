import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(process.env.DATA_DIR || join(__dirname, "..", "data"));
const DATA_FILE = join(DATA_DIR, "faucet-history.json");
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readHistory() {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeHistory(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/faucet-history", (req, res) => {
  const { network } = req.query;
  let history = readHistory();

  if (network && network !== "all") {
    history = history.filter(entry => entry.network === network);
  }

  res.json(history);
});

app.post("/api/faucet-history", (req, res) => {
  const { address, txHash, network } = req.body;
  if (!address || !txHash) {
    return res.status(400).json({ error: "address and txHash required" });
  }
  const history = readHistory();
  const entry = {
    address,
    txHash,
    timestamp: new Date().toISOString(),
    network: network || "Sepolia",
    status: "Pending",
  };
  history.unshift(entry);
  writeHistory(history.slice(0, 50));
  res.status(201).json(entry);
});

app.put("/api/faucet-history/:txHash", (req, res) => {
  const history = readHistory();
  const idx = history.findIndex((e) => e.txHash === req.params.txHash);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  history[idx].status = "Confirmed";
  writeHistory(history);
  res.json(history[idx]);
});

app.delete("/api/faucet-history", (_req, res) => {
  writeHistory([]);
  res.json({ ok: true });
});

if (isProduction) {
  const distPath = join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Faucet API running on http://localhost:${PORT}`);
});
