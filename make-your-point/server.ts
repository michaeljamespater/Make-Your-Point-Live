import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Use process.cwd() so this works in both local and Render production builds
const projectRoot = process.cwd();
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "50mb" }));

// In-memory store for demo
let points: any[] = [];
let replies: Record<string, any[]> = {};
let sponsorships: Record<string, any[]> = {};
let manifesto = {
  title: "Make Your Point",
  description: "Your voice matters. Speak freely, be heard, and know you are not alone.",
  corePillar: "",
  pillarTitle: "",
  rule1Title: "Honest voices stay",
  rule1Content: "Spam and empty noise are filtered. Real opinions — even hard or unpopular ones — are protected and kept.",
  rule2Title: "You are welcome here",
  rule2Content: "No gatekeepers. No need to be polished. If something needs saying, say it with respect, and you will be heard."
};
let discoveryStats: Record<string, number> = {};
let paypalConfig = { paypalEmail: "", paypalMeLink: "" };

// --- API ROUTES ---
app.get("/api/points", (req, res) => {
  let result = [...points];
  const { category, subcategory, audience, search } = req.query;
  if (category) result = result.filter(p => p.category === category);
  if (subcategory) result = result.filter(p => p.subcategory === subcategory);
  if (audience) result = result.filter(p => p.targetAudience === audience);
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.authorMoniker?.toLowerCase().includes(q)
    );
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.post("/api/points", (req, res) => {
  const body = req.body;
  if (!body.content?.trim()) return res.status(400).json({ error: "Content required" });
  const point = {
    id: `pt-${Date.now()}`,
    title: body.title || body.content.slice(0, 60),
    content: body.content,
    category: body.category || "Point",
    subcategory: body.subcategory || "General",
    targetAudience: body.targetAudience || "Makers",
    authorMoniker: body.authorMoniker || "Anonymous",
    tags: body.tags || [],
    webAddress: body.webAddress,
    media: body.media || [],
    reactions: { hearHear: 0, respect: 0, supported: 0, thoughtProvoking: 0 },
    repliesCount: 0,
    sponsorshipsTotal: 0,
    sponsorshipsCount: 0,
    linkedFromPointId: body.linkedFromPointId,
    linkedFromPointTitle: body.linkedFromPointTitle,
    createdAt: new Date().toISOString()
  };
  points.unshift(point);
  res.json(point);
});

app.put("/api/points/:id", (req, res) => {
  const idx = points.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  points[idx] = { ...points[idx], ...req.body };
  res.json(points[idx]);
});

app.delete("/api/points/:id", (req, res) => {
  const pt = points.find(p => p.id === req.params.id);
  if (!pt) return res.status(404).json({ error: "Not found" });

  const { authorMoniker, isEditorMode } = req.body || {};
  const isOwner = isEditorMode === true;
  const isAuthor =
    authorMoniker &&
    (pt.authorMoniker || "").trim().toLowerCase() === String(authorMoniker).trim().toLowerCase();

  if (!isOwner && !isAuthor) {
    return res.status(403).json({ error: "You can only delete your own points" });
  }

  points = points.filter(p => p.id !== req.params.id);
  delete replies[req.params.id];
  delete sponsorships[req.params.id];
  res.json({ ok: true });
});

app.post("/api/points/:id/react", (req, res) => {
  const pt = points.find(p => p.id === req.params.id);
  if (!pt) return res.status(404).json({ error: "Not found" });
  const type = req.body.reactionType;
  if (pt.reactions[type] !== undefined) pt.reactions[type]++;
  res.json(pt.reactions);
});

app.get("/api/points/:id/replies", (req, res) => {
  res.json(replies[req.params.id] || []);
});

app.post("/api/points/:id/replies", (req, res) => {
  const reply = {
    id: `r-${Date.now()}`,
    pointId: req.params.id,
    content: req.body.content,
    authorMoniker: req.body.authorMoniker || "Anonymous",
    createdAt: new Date().toISOString()
  };
  if (!replies[req.params.id]) replies[req.params.id] = [];
  replies[req.params.id].push(reply);
  const pt = points.find(p => p.id === req.params.id);
  if (pt) pt.repliesCount = (pt.repliesCount || 0) + 1;
  res.json(reply);
});

app.post("/api/points/:id/sponsor", (req, res) => {
  const pt = points.find(p => p.id === req.params.id);
  if (!pt) return res.status(404).json({ error: "Not found" });
  const amount = Number(req.body.amount) || 0;
  if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  const entry = {
    id: `spon-${Date.now()}`,
    pointId: req.params.id,
    amount,
    currency: req.body.currency || "GBP",
    authorMoniker: (req.body.authorMoniker || "Anonymous").trim(),
    message: (req.body.message || "").trim(),
    mode: req.body.mode || "sandbox",
    createdAt: new Date().toISOString()
  };

  if (!sponsorships[req.params.id]) sponsorships[req.params.id] = [];
  sponsorships[req.params.id].unshift(entry);

  pt.sponsorshipsTotal = (pt.sponsorshipsTotal || 0) + amount;
  pt.sponsorshipsCount = (pt.sponsorshipsCount || 0) + 1;

  res.json({
    ok: true,
    total: pt.sponsorshipsTotal,
    count: pt.sponsorshipsCount,
    sponsorship: entry
  });
});

app.get("/api/points/:id/sponsorships", (req, res) => {
  res.json(sponsorships[req.params.id] || []);
});
app.post("/api/points/swap-order", (req, res) => res.json({ ok: true }));

app.get("/api/categories", (req, res) => {
  const map: Record<string, any> = {};
  points.forEach(p => {
    if (!map[p.category]) map[p.category] = { name: p.category, count: 0, repliesCount: 0, subcategories: {} };
    map[p.category].count++;
    map[p.category].repliesCount += p.repliesCount || 0;
    const sub = p.subcategory || "General";
    if (!map[p.category].subcategories[sub]) map[p.category].subcategories[sub] = { name: sub, count: 0, repliesCount: 0 };
    map[p.category].subcategories[sub].count++;
  });
  const categories = Object.values(map).map((c: any) => ({
    ...c,
    subcategories: Object.values(c.subcategories)
  }));
  const audienceCounts: Record<string, number> = {};
  points.forEach(p => {
    audienceCounts[p.targetAudience] = (audienceCounts[p.targetAudience] || 0) + 1;
  });
  res.json({ categories, audienceCounts });
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalPoints: points.length,
    totalConnections: points.filter(p => p.linkedFromPointId).length
  });
});

app.get("/api/manifesto", (req, res) => res.json(manifesto));
app.put("/api/manifesto", (req, res) => {
  manifesto = { ...manifesto, ...req.body };
  res.json(manifesto);
});
app.post("/api/manifesto/ai-rewrite", (req, res) => {
  res.json({ ...req.body.currentData, explanation: "AI rewrite simulated." });
});

app.get("/api/discovery/stats", (req, res) => res.json(discoveryStats));
app.post("/api/discovery/vote", (req, res) => {
  const s = req.body.source;
  discoveryStats[s] = (discoveryStats[s] || 0) + 1;
  res.json({ ok: true });
});

app.post("/api/check-reality", (req, res) => {
  res.json({
    status: "independent",
    rating: 82,
    title: "Independent Mind Confirmed",
    message: "Appears grounded in personal perspective.",
    challenge: "Ready to publish."
  });
});

app.post("/api/spellcheck", (req, res) => {
  res.json({
    polishedTitle: req.body.title,
    polishedContent: req.body.content,
    corrections: []
  });
});

app.post("/api/upload", (req, res) => {
  const { base64Data, fileType, filename } = req.body;
  const type = fileType?.startsWith("video/") ? "video" : fileType?.startsWith("audio/") ? "audio" : "photo";
  res.json({ url: base64Data, type, name: filename });
});

app.get("/api/monetization/status", (req, res) => {
  res.json({
    isStripeConfigured: false,
    publishableKeyPlaceholder: "pk_test_...",
    globalSponsorshipsTotal: points.reduce((s, p) => s + (p.sponsorshipsTotal || 0), 0),
    globalSponsorshipsCount: points.reduce((s, p) => s + (p.sponsorshipsCount || 0), 0),
    topSponsoredPoints: points
      .filter(p => p.sponsorshipsTotal > 0)
      .sort((a, b) => (b.sponsorshipsTotal || 0) - (a.sponsorshipsTotal || 0))
      .slice(0, 5)
  });
});

app.get("/api/config/paypal", (req, res) => res.json(paypalConfig));
app.post("/api/config/paypal", (req, res) => {
  paypalConfig = { ...paypalConfig, ...req.body };
  res.json(paypalConfig);
});

app.post("/api/seed-all", (req, res) => {
  points = [];
  replies = {};
  sponsorships = {};
  res.json({ ok: true });
});

// --- FRONTEND ---
async function start() {
  if (!isProd) {
    // Development: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production: static files
    app.use(express.static(path.join(projectRoot, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(projectRoot, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n  Make Your Point is running!`);
    console.log(`  PC:    http://localhost:${PORT}`);
    console.log(`  Phone: http://YOUR-PC-IP:${PORT}`);
    console.log(`  (Find YOUR-PC-IP with: ipconfig → IPv4 Address)\n`);
  });
}

start();
