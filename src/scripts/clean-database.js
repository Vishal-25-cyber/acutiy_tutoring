require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acuity_tutoring";

// ── SCHEMAS ──
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true, index: true },
  altPhone: { type: String, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["STUDENT", "TEACHER", "ADMIN"], required: true, index: true },
  status: { type: String, enum: ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED", "REJECTED"], default: "ACTIVE", index: true },
  avatarUrl: { type: String, default: "" },
}, { timestamps: true });

const SystemSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: "Acuity Tutoring & Live Learning" },
  instituteName: { type: String, default: "Acuity Tutoring" },
  tagline: { type: String, default: "Where Accuracy Meets Knowledge" },
  logoUrl: { type: String, default: "" },
  upiId: { type: String, default: "acuity.tutoring@upi" },
  qrCodeImageUrl: { type: String, default: "" },
  supportPhone1: { type: String, default: "9876543210" },
  supportPhone2: { type: String, default: "9876543211" },
  supportPhone3: { type: String, default: "9876543212" },
  supportEmail: { type: String, default: "support@acuity.edu" },
  defaultGracePeriodMinutes: { type: Number, default: 5 },
  minAttendanceThresholdPercent: { type: Number, default: 75 },
  monthlyTuitionFee: { type: Number, default: 1999 },
  monthlyFee: { type: Number, default: 1999 },
  registrationFee: { type: Number, default: 500 },
  academicYear: { type: String, default: "2025-2026" },
}, { timestamps: true });

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  days: [{ type: String }],
  capacity: { type: Number, default: 30 },
  gracePeriodMinutes: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function main() {
  console.log("🔌 Connecting to MongoDB:", MONGODB_URI.replace(/:([^:@]+)@/, ":***@"));
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected successfully!");

  const db = mongoose.connection.db;

  // Drop ALL existing collections to completely purge all previous dummy/test data
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).drop();
    console.log(`   🗑  Purged collection: ${col.name}`);
  }
  console.log(`✅ All ${collections.length} database collections cleanly dropped.`);

  // Register models
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const SystemSettings = mongoose.models.SystemSettings || mongoose.model("SystemSettings", SystemSettingsSchema);
  const Batch = mongoose.models.Batch || mongoose.model("Batch", BatchSchema);

  // Generate secure password hash for Admin
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("Admin@123", salt);

  // 1. Create Primary Admin Account (admin@gmail.com)
  const admin1 = await User.create({
    name: "System Administrator",
    email: "admin@gmail.com",
    phone: "9876543210",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    status: "ACTIVE",
  });

  // 2. Also register admin@acuity.edu as secondary admin
  const admin2 = await User.create({
    name: "Acuity Admin",
    email: "admin@acuity.edu",
    phone: "9876543211",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    status: "ACTIVE",
  });

  console.log("👤 Admin Accounts Initialized:");
  console.log("   - Email: admin@gmail.com | Password: Admin@123");
  console.log("   - Email: admin@acuity.edu | Password: Admin@123");

  // 3. Create Default System Configuration
  const settings = await SystemSettings.create({
    companyName: "Acuity Tutoring & Live Learning",
    instituteName: "Acuity Tutoring",
    tagline: "Where Accuracy Meets Knowledge",
    logoUrl: "",
    upiId: "acuity.tutoring@upi",
    qrCodeImageUrl: "",
    supportPhone1: "9876543210",
    supportPhone2: "9876543211",
    supportPhone3: "9876543212",
    supportEmail: "support@acuity.edu",
    defaultGracePeriodMinutes: 5,
    minAttendanceThresholdPercent: 75,
    monthlyTuitionFee: 1999,
    monthlyFee: 1999,
    registrationFee: 500,
    academicYear: "2025-2026",
  });
  console.log("⚙️  Clean System Settings configured (Monthly Fee: ₹1999).");

  // 4. Create Standard Live Class Batches
  await Batch.create([
    {
      name: "6:00 PM – 7:00 PM",
      startTime: "18:00",
      endTime: "19:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      capacity: 30,
      gracePeriodMinutes: 5,
      isActive: true,
    },
    {
      name: "7:00 PM – 8:00 PM",
      startTime: "19:00",
      endTime: "20:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      capacity: 30,
      gracePeriodMinutes: 5,
      isActive: true,
    },
    {
      name: "8:00 PM – 9:00 PM",
      startTime: "20:00",
      endTime: "21:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      capacity: 30,
      gracePeriodMinutes: 5,
      isActive: true,
    },
  ]);
  console.log("📅 3 Clean Default Class Batches created.");

  console.log("\n=======================================================");
  console.log("✨ DATABASE CLEAN PURGE COMPLETE — FRESH START READY ✨");
  console.log("=======================================================");
  console.log("Admin Login: admin@gmail.com / Admin@123");
  console.log("Portal URL:  http://localhost:3003\n");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Clean purge failed:", err);
  process.exit(1);
});
