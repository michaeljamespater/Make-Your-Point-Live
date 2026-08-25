import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const projectRoot = process.cwd();
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "50mb" }));

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

let firestore: any = null;
let useFirebase = false;

async function connectDb() {
  const fs = await import("fs");
  let sa = process.env.FIREBASE_SERVICE_ACCOUNT || "";
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE ||
    "/etc/secrets/FIREBASE_SERVICE_ACCOUNT" ||
    "/etc/secrets/firebase.json";
  if (!sa) {
    for (const p of [
      process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
      "/etc/secrets/FIREBASE_SERVICE_ACCOUNT",
      "/etc/secrets/firebase.json",
      "/etc/secrets/serviceAccount.json"
    ]) {
      if (p && fs.existsSync(p)) {
        sa = fs.readFileSync(p, "utf8");
        console.log("  Loaded Firebase key from file:", p);
        break;
      }
    }
  }
  if (!sa) {
    console.log("  No FIREBASE_SERVICE_ACCOUNT — memory only (data lost on restart)");
    return;
  }
  try {
    const admin = await import("firebase-admin");
    const cred = JSON.parse(sa);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(cred)
      });
    }
    firestore = admin.firestore();
    useFirebase = true;
    console.log("  Firebase connected — points will persist");
    await loadAll();
  } catch (err) {
    console.error("  Firebase connect failed, using memory only:", err);
    firestore = null;
    useFirebase = false;
  }
}

async function loadAll() {
  if (!firestore) return;
  const snap = await firestore.collection("store").doc("main").get();
  if (snap.exists) {
    const doc = snap.data() || {};
    points = doc.points || [];
    replies = doc.replies || {};
    sponsorships = doc.sponsorships || {};
    manifesto = doc.manifesto || manifesto;
    discoveryStats = doc.discoveryStats || {};
    paypalConfig = doc.paypalConfig || paypalConfig;
    console.log(`  Loaded ${points.length} points from Firebase`);
  }
}

async function saveAll() {
  if (!firestore) return;
  try {
    await firestore.collection("store").doc("main").set({
      points,
      replies,
      sponsorships,
      manifesto,
      discoveryStats,
      paypalConfig,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("  Firebase save failed:", err);
  }
}

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

app.post("/api/points", async (req, res) => {
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
  await saveAll();
  res.json(point);
});

app.put("/api/points/:id", async (req, res) => {
  const idx = points.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  points[idx] = { ...points[idx], ...req.body };
  await saveAll();
  res.json(points[idx]);
});

app.delete("/api/points/:id", async (req, res) => {
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
  await saveAll();
  res.json({ ok: true });
});

app.post("/api/points/:id/react", async (req, res) => {
  const pt = points.find(p => p.id === req.params.id);
  if (!pt) return res.status(404).json({ error: "Not found" });
  const type = req.body.reactionType;
  if (pt.reactions[type] !== undefined) pt.reactions[type]++;
  await saveAll();
  res.json(pt.reactions);
});

app.get("/api/points/:id/replies", (req, res) => {
  res.json(replies[req.params.id] || []);
});

app.post("/api/points/:id/replies", async (req, res) => {
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
  await saveAll();
  res.json(reply);
});

app.post("/api/points/:id/sponsor", async (req, res) => {
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
  await saveAll();
  res.json({ ok: true, total: pt.sponsorshipsTotal, count: pt.sponsorshipsCount, sponsorship: entry });
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
  res.json(Object.values(map));
});

app.get("/api/stats", (req, res) => {
  res.json({
    totalPoints: points.length,
    totalConnections: points.filter(p => p.linkedFromPointId).length,
    persistence: useFirebase ? "firebase" : "memory"
  });
});

app.get("/api/manifesto", (req, res) => res.json(manifesto));
app.put("/api/manifesto", async (req, res) => {
  manifesto = { ...manifesto, ...req.body };
  await saveAll();
  res.json(manifesto);
});
app.post("/api/manifesto/ai-rewrite", (req, res) => res.json(manifesto));

app.get("/api/discovery/stats", (req, res) => res.json(discoveryStats));
app.post("/api/discovery/vote", async (req, res) => {
  const key = req.body?.option || "default";
  discoveryStats[key] = (discoveryStats[key] || 0) + 1;
  await saveAll();
  res.json(discoveryStats);
});

app.post("/api/check-reality", (req, res) => res.json({ ok: true }));
app.post("/api/spellcheck", (req, res) => res.json({ corrected: req.body?.text || "", suggestions: [] }));
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
app.post("/api/config/paypal", async (req, res) => {
  paypalConfig = { ...paypalConfig, ...req.body };
  await saveAll();
  res.json(paypalConfig);
});

app.post("/api/seed-all", async (req, res) => {
  points = [];
  replies = {};
  sponsorships = {};
  await saveAll();
  res.json({ ok: true });
});

async function start() {
  await connectDb();
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(projectRoot, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(projectRoot, "dist", "index.html"));
    });
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n  Make Your Point is running!`);
    console.log(`  DB:    ${useFirebase ? "Firebase (persistent)" : "memory only"}\n`);
  });
}

start();
