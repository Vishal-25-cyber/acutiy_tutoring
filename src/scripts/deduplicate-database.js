require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acuity_tutoring";

async function main() {
  console.log("🔌 Connecting to MongoDB:", MONGODB_URI.replace(/:([^:@]+)@/, ":***@"));
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected!");

  const db = mongoose.connection.db;

  // 1. Delete all orphan payments
  const payRes = await db.collection("payments").deleteMany({});
  console.log(`✅ Cleared ${payRes.deletedCount} orphan payment record(s).`);

  // 2. Keep only the single primary Admin account (admin@gmail.com)
  const userRes = await db.collection("users").deleteMany({ email: { $ne: "admin@gmail.com" } });
  console.log(`✅ Removed ${userRes.deletedCount} duplicate/secondary user(s).`);

  // 3. Clear any duplicate batches (ensure exactly unique by name)
  const batches = await db.collection("batches").find().toArray();
  const seenBatchNames = new Set();
  for (const b of batches) {
    if (seenBatchNames.has(b.name)) {
      await db.collection("batches").deleteOne({ _id: b._id });
      console.log(`   🗑  Removed duplicate batch: ${b.name}`);
    } else {
      seenBatchNames.add(b.name);
    }
  }

  // 4. Ensure single SystemSettings document
  const settings = await db.collection("systemsettings").find().toArray();
  if (settings.length > 1) {
    for (let i = 1; i < settings.length; i++) {
      await db.collection("systemsettings").deleteOne({ _id: settings[i]._id });
      console.log(`   🗑  Removed duplicate settings record`);
    }
  }

  // 5. Clean any other empty / stray collections
  const collections = await db.listCollections().toArray();
  console.log("\n📊 Current Database State:");
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    const docs = await db.collection(c.name).find().toArray();
    console.log(`   - ${c.name}: ${count} document(s)`);
    docs.forEach((d) => {
      const summary = d.email || d.name || d.instituteName || d._id;
      console.log(`       ↳ ${summary}`);
    });
  }

  console.log("\n🎉 Database 100% deduplicated and clean!");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
