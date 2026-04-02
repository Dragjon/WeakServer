const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// DELETE THIS AFTER
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

const ENGINE_PATH = "./binaries/weak-1.0.0-linux_v4";


app.post("/move", (req, res) => {
  const { startfen, ucimoves } = req.body;

  if (!startfen) {
    return res.status(400).json({ error: "Missing startfen" });
  }

  const engine = spawn(ENGINE_PATH);

  let output = "";
  let bestMove = null;

  engine.stdout.on("data", (data) => {
    const text = data.toString();
    output += text;

    const match = text.match(/bestmove\s(\S+)/);
    if (match) {
      bestMove = match[1];

      engine.stdin.write("quit\n");
      engine.kill();

      return res.json({
        bestmove: bestMove,
        raw: output
      });
    }
  });

  engine.stderr.on("data", (data) => {
    console.error("Engine error:", data.toString());
  });

  engine.on("error", (err) => {
    console.error("Failed to start engine:", err);
    res.status(500).json({ error: "Engine failed to start" });
  });

  engine.stdin.write("uci\n");
  engine.stdin.write("isready\n");

  if (startfen === "startpos") {
    engine.stdin.write(`position startpos moves ${ucimoves.join(" ")}\n`);
  } else {
    engine.stdin.write(`position fen ${startfen} moves ${ucimoves.join(" ")}\n`);
  }

  engine.stdin.write("go wtime 10000 btime 10000 winc 1000 binc 1000\n");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});