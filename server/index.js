import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data.json");
const PORT = process.env.PORT || 3001;

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

app.get("/api/faucet-history", (_req, res) => {
  res.json(readHistory());
});

app.post("/api/faucet-history", (req, res) => {
  const { address, txHash } = req.body;
  if (!address || !txHash) {
    return res.status(400).json({ error: "address and txHash required" });
  }
  const history = readHistory();
  const entry = {
    address,
    txHash,
    timestamp: new Date().toISOString(),
    network: "Sepolia",
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

app.listen(PORT, () => {
  console.log(`Faucet API running on http://localhost:${PORT}`);
});
