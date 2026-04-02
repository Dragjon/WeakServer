const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "https://quantamshade0337.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]

}));

app.use(express.json());

const ENGINE_PATH = path.join(__dirname, "binaries", "weak-1.0.0-linux_v3");

try {
  if (fs.existsSync(ENGINE_PATH)) {
    fs.chmodSync(ENGINE_PATH, "755");
    console.log("Engine permissions set successfully.");
  } else {
    console.warn(`Warning: Engine not found at ${ENGINE_PATH}`);
  }
} catch (err) {
  console.error("Error setting engine permissions:", err);
}

app.post("/move", (req, res) => {
  const { startfen, ucimoves = [] } = req.body;

  if (!startfen) {
    return res.status(400).json({ error: "Missing startfen" });
  }

  const engine = spawn(ENGINE_PATH);

  let output = "";
  let bestMoveFound = false;

  engine.stdout.on("data", (data) => {
    const text = data.toString();
    output += text;

    const match = text.match(/bestmove\s(\S+)/);
    if (match && !bestMoveFound) {
      bestMoveFound = true; // Prevents multiple responses
      const bestMove = match[1];

      engine.stdin.write("quit\n");
      engine.kill();

      return res.json({
        bestmove: bestMove,
        raw: output
      });
    }
  });

  engine.stderr.on("data", (data) => {
    console.error("Engine stderr:", data.toString());
  });

  engine.on("error", (err) => {
    console.error("Failed to start engine:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Engine failed to start", details: err.message });
    }
  });

  // Basic UCI sequence
  engine.stdin.write("uci\n");
  engine.stdin.write("isready\n");

  const movesString = ucimoves.length > 0 ? ` moves ${ucimoves.join(" ")}` : "";
  
  if (startfen === "startpos") {
    engine.stdin.write(`position startpos${movesString}\n`);
  } else {
    engine.stdin.write(`position fen ${startfen}${movesString}\n`);
  }

  engine.stdin.write("go wtime 10000 btime 10000 winc 1000 binc 1000\n");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});