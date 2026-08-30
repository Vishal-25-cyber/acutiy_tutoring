/**
 * Direct MongoDB Database Reset Script
 * Run with: node src/scripts/reset-database.js
 * 
 * This will:
 * 1. Drop ALL collections in acuity_tutoring
 * 2. Create one fresh Admin account (email: admin@gmail.com, password: Admin@123)
 * 3. Create default SystemSettings
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acuity_tutoring";

// ── SCHEMAS (minimal inline) ──
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  phone: String,
  passwordHash: String,
  role: { type: String, enum: ["STUDENT", "TEACHER", "ADMIN"] },
  status: { type: String, default: "ACTIVE" },
}, { timestamps: true });

const SystemSettingsSchema = new mongoose.Schema({
  instituteName: { type: String, default: "Acuity Tutoring" },
  tagline: { type: String, default: "Where Accuracy Meets Knowledge" },
  phone: String,
  email: String,
  address: String,
  gracePeriodMinutes: { type: Number, default: 10 },
  minAttendancePercent: { type: Number, default: 75 },
  monthlyFee: { type: Number, default: 2500 },
  upiId: { type: String, default: "" },
}, { timestamps: true });

async function main() {
  console.log("🔌 Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected!");

  const db = mongoose.connection.db;

  // Drop all collections
  const collections = await db.listCollections().toArray();
  if (collections.length === 0) {
    console.log("📭 No collections to drop. Starting fresh.");
  } else {
    for (const col of collections) {
      await db.collection(col.name).drop();
      console.log(`   🗑  Dropped collection: ${col.name}`);
    }
    console.log(`✅ Dropped ${collections.length} collection(s).`);
  }

  // Register models
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const SystemSettings = mongoose.models.SystemSettings || mongoose.model("SystemSettings", SystemSettingsSchema);

  // Create admin account
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin@123", salt);

  const admin = await User.create({
    name: "Administrator",
    email: "admin@gmail.com",
    phone: "",
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
  });

  console.log("👤 Admin account created:");
  console.log("   Email:    admin@gmail.com");
  console.log("   Password: Admin@123");
  console.log("   Role:     ADMIN");
  console.log("   ID:      ", admin._id.toString());

  // Create default system settings
  await SystemSettings.create({
    instituteName: "Acuity Tutoring",
    tagline: "Where Accuracy Meets Knowledge",
    phone: "",
    email: "admin@gmail.com",
    address: "",
    gracePeriodMinutes: 10,
    minAttendancePercent: 75,
    monthlyFee: 2500,
    upiId: "",
  });

  console.log("⚙️  Default SystemSettings created.");
  console.log("\n🎉 Database reset complete! Fresh start ready.");
  console.log("\n📋 Next steps:");
  console.log("   1. Log in at http://localhost:3003 with admin@gmail.com / Admin@123");
  console.log("   2. Go to Admin > Teachers — register real teachers");
  console.log("   3. Go to Admin > Batches — create real class batches");
  console.log("   4. Go to Admin > Students — register real students");
  console.log("   5. Each student gets their own login credentials");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Reset failed:", err.message);
  process.exit(1);
});
