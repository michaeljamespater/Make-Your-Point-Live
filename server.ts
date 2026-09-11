// firebase-secret-loader-v7-2026-09-10
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
let storeLoaded = false;
let lastSavedPointCount = 0;

async function connectDb() {
  const fs = await import("fs");
  let sa = process.env.FIREBASE_SERVICE_ACCOUNT || "";
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE ||
    "/etc/secrets/FIREBASE_SERVICE_ACCOUNT" ||
    "/etc/secrets/firebase.json";
  if (!sa) {
    const candidates = [
      process.env.FIREBASE_SERVICE_ACCOUNT_FILE,
      "/etc/secrets/FIREBASE_SERVICE_ACCOUNT",
      "/etc/secrets/firebase.json",
      "/etc/secrets/serviceAccount.json",
      "/etc/secrets/NEW_SECRET",
      path.join(projectRoot, "NEW_SECRET"),
      path.join(projectRoot, "firebase.json"),
      path.join(projectRoot, "serviceAccount.json")
    ];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) {
        sa = fs.readFileSync(p, "utf8");
        console.log("  Loaded Firebase key from file:", p);
        break;
      }
    }
    if (!sa) {
      try {
        const secretsDir = "/etc/secrets";
        if (fs.existsSync(secretsDir)) {
          const files = fs.readdirSync(secretsDir);
          console.log("  Secret files present:", files.join(", ") || "(none)");
          const ordered = [
            ...files.filter(f => f.includes("firebase") || f.includes("adminsdk")),
            ...files.filter(f => !f.startsWith(".."))
          ];
          for (const f of ordered) {
            if (f.startsWith("..")) continue;
            const full = path.join(secretsDir, f);
            try {
              const content = fs.readFileSync(full, "utf8").trim();
              console.log("  Checking secret file:", f, "length:", content.length);
              if (content.includes("private_key") || content.includes("service_account")) {
                sa = content;
                console.log("  Loaded Firebase key from secret file:", full);
                break;
              }
            } catch (readErr) {
              console.log("  Could not read", f, String(readErr));
            }
          }
        }
      } catch (e) {
        console.log("  Could not list /etc/secrets", String(e));
      }
    }
  }
  if (!sa) {
    try {
      const rootFiles = fs.readdirSync(projectRoot);
      console.log("  Project root files:", rootFiles.filter(f => !f.startsWith(".") && f !== "node_modules" && f !== "dist").join(", "));
      for (const f of rootFiles) {
        if (f === "NEW_SECRET" || f === "firebase.json" || f.endsWith(".json")) {
          const content = fs.readFileSync(path.join(projectRoot, f), "utf8");
          if (content.includes("private_key") || content.includes("service_account")) {
            sa = content;
            console.log("  Loaded Firebase key from root file:", f);
            break;
          }
        }
      }
    } catch (e) {
      console.log("  Could not scan project root");
    }
  }
  if (!sa) {
    console.log("  No FIREBASE_SERVICE_ACCOUNT — memory only (data lost on restart)");
    return;
  }
  try {
    const adminMod = await import("firebase-admin");
    const admin = adminMod.default || adminMod;
    const cred = JSON.parse(sa);
    const apps = admin.apps || [];
    if (!apps.length) {
      const bucketName =
        process.env.FIREBASE_STORAGE_BUCKET ||
        `${cred.project_id}.firebasestorage.app`;
      admin.initializeApp({
        credential: admin.credential.cert(cred),
        storageBucket: bucketName
      });
      console.log("  Storage bucket:", bucketName);
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


function stripUndefined(value: any): any {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
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
    lastSavedPointCount = points.length;
  } else {
    console.log("  Firebase store/main is empty — not overwriting until data exists");
  }
  storeLoaded = true;
}

async function saveAll() {
  if (!firestore) return;
  if (!storeLoaded) {
    console.log("  Skip save — store not loaded yet");
    return;
  }
  if ((points || []).length === 0 && lastSavedPointCount > 0) {
    console.log("  Skip save — refused to wipe", lastSavedPointCount, "existing points");
    await loadAll();
    return;
  }
  try {
    const cleanPoints = (points || []).map((pt: any) => {
      const oldMedia = Array.isArray(pt.media) ? pt.media : [];
      const kept = oldMedia.filter((m: any) => m && typeof m.url === "string" && (m.url.startsWith("http") || m.url.startsWith("data:")));
      return { ...pt, media: kept.filter((m: any) => m.url.startsWith("http") || m.url.startsWith("https")) };
    });
    const payload = stripUndefined({
      points: cleanPoints,
      replies,
      sponsorships,
      manifesto,
      discoveryStats,
      paypalConfig,
      updatedAt: new Date().toISOString()
    });
    await firestore.collection("store").doc("main").set(payload);
    lastSavedPointCount = cleanPoints.length;
    console.log("  Firebase saved", cleanPoints.length, "points");
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
  const incoming = { ...req.body };
  const existing = points[idx];
  if (!Object.prototype.hasOwnProperty.call(incoming, "media") || incoming.media == null) {
    incoming.media = existing.media || [];
  }
  if (Array.isArray(incoming.media) && incoming.media.length === 0 && (existing.media || []).length > 0 && incoming._clearMedia !== true) {
    incoming.media = existing.media;
  }
  delete incoming._clearMedia;
  points[idx] = { ...existing, ...incoming, id: existing.id };
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

app.put("/api/points/:id/replies/:replyId", async (req, res) => {
  const list = replies[req.params.id] || [];
  const reply = list.find((r: any) => r.id === req.params.replyId);
  if (!reply) return res.status(404).json({ error: "Not found" });
  if (req.body.content != null) reply.content = req.body.content;
  await saveAll();
  res.json(reply);
});

app.delete("/api/points/:id/replies/:replyId", async (req, res) => {
  const list = replies[req.params.id] || [];
  replies[req.params.id] = list.filter((r: any) => r.id !== req.params.replyId);
  const pt = points.find(p => p.id === req.params.id);
  if (pt) pt.repliesCount = Math.max(0, (pt.repliesCount || 1) - 1);
  await saveAll();
  res.json({ ok: true });
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
app.post("/api/upload", async (req, res) => {
  const { base64Data, fileType, filename } = req.body;
  const type = fileType?.startsWith("video/")
    ? "video"
    : fileType?.startsWith("audio/")
      ? "audio"
      : fileType?.startsWith("image/")
        ? "photo"
        : "file";
  if (!base64Data) return res.status(400).json({ error: "No file data" });

  if (useFirebase) {
    try {
      const adminMod = await import("firebase-admin");
      const admin = adminMod.default || adminMod;
      const raw = String(base64Data).includes(",") ? String(base64Data).split(",")[1] : String(base64Data);
      const buffer = Buffer.from(raw, "base64");
      const safeName = String(filename || `file-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectPath = `uploads/${Date.now()}-${safeName}`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(objectPath);
      await file.save(buffer, {
        metadata: { contentType: fileType || "application/octet-stream" },
        resumable: false
      });
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "2099-12-31"
      });
      console.log("  Stored media in Firebase Storage:", objectPath);
      return res.json({ url, type, name: filename || safeName });
    } catch (err) {
      console.error("  Firebase Storage upload failed:", err);
      try {
        const adminMod2 = await import("firebase-admin");
        const admin2 = adminMod2.default || adminMod2;
        const cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
        const alt = admin2.storage().bucket(`${(cred.project_id || "make-your-point-11539")}.appspot.com`);
        const raw2 = String(base64Data).includes(",") ? String(base64Data).split(",")[1] : String(base64Data);
        const buffer2 = Buffer.from(raw2, "base64");
        const safeName2 = String(filename || `file-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const objectPath2 = `uploads/${Date.now()}-${safeName2}`;
        const file2 = alt.file(objectPath2);
        await file2.save(buffer2, { metadata: { contentType: fileType || "application/octet-stream" }, resumable: false });
        const [url2] = await file2.getSignedUrl({ action: "read", expires: "2099-12-31" });
        console.log("  Stored media in fallback bucket:", objectPath2);
        return res.json({ url: url2, type, name: filename || safeName2 });
      } catch (err2) {
        console.error("  Fallback storage failed:", err2);
        return res.status(500).json({ error: "Video/file storage failed. Check Firebase Storage is enabled." });
      }
    }
  }

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
