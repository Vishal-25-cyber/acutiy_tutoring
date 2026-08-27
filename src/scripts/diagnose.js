const http = require("http");
const mongoose = require("mongoose");

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get("http://localhost:3000/", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ ok: true, status: res.statusCode, length: data.length });
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, error: "TIMEOUT" });
    });
  });
}

async function checkMongo() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/acuity_tutoring", { serverSelectionTimeoutMS: 3000 });
    const collections = await mongoose.connection.db.listCollections().toArray();
    await mongoose.disconnect();
    return { ok: true, collections: collections.map((c) => c.name) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log("--- DIAGNOSTIC RESULTS ---");
  const mongo = await checkMongo();
  console.log("MongoDB status:", JSON.stringify(mongo));

  const server = await checkServer();
  console.log("Next.js Server on :3000:", JSON.stringify(server));
}

main();
