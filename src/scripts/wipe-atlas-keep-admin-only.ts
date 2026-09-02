import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectToDatabase from "../lib/db/mongoose";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import TeacherProfile from "../models/TeacherProfile";
import Assignment from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Attendance from "../models/Attendance";
import LiveSession from "../models/LiveSession";
import Payment from "../models/Payment";
import Notification from "../models/Notification";
import Material from "../models/Material";
import Batch from "../models/Batch";
import Subject from "../models/Subject";
import Announcement from "../models/Announcement";
import AuditLog from "../models/AuditLog";
import Inquiry from "../models/Inquiry";
import ParentCommunication from "../models/ParentCommunication";
import StaffAttendance from "../models/StaffAttendance";
import StudentReportHistory from "../models/StudentReportHistory";
import TeacherRemark from "../models/TeacherRemark";
import Test from "../models/Test";
import TestResult from "../models/TestResult";
import SystemSettings from "../models/SystemSettings";

async function wipeDatabaseKeepAdminOnly() {
  console.log("🔌 Connecting to MongoDB Atlas...");
  await connectToDatabase();
  console.log("✅ Connected to Atlas successfully!");

  console.log("\n🧹 Purging all collections except Admin credentials...");

  // 1. Delete all non-admin users
  const userDeleteRes = await User.deleteMany({ role: { $ne: "ADMIN" } });
  console.log(`   ✅ Deleted ${userDeleteRes.deletedCount} non-admin user account(s).`);

  // 2. Ensure primary Admin exists with valid password
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const adminUser = await User.findOneAndUpdate(
    { email: "admin@gmail.com" },
    {
      name: "System Administrator",
      email: "admin@gmail.com",
      phone: "9876543210",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    { upsert: true, new: true }
  );
  console.log(`   👑 Verified Primary Admin: ${adminUser.email} (Role: ${adminUser.role})`);

  // 3. Delete all Student & Teacher profiles
  const spRes = await StudentProfile.deleteMany({});
  console.log(`   ✅ Cleared ${spRes.deletedCount} StudentProfile record(s).`);

  const tpRes = await TeacherProfile.deleteMany({});
  console.log(`   ✅ Cleared ${tpRes.deletedCount} TeacherProfile record(s).`);

  // 4. Delete all Assignments & Submissions
  const assignRes = await Assignment.deleteMany({});
  console.log(`   ✅ Cleared ${assignRes.deletedCount} Assignment record(s).`);

  const subRes = await AssignmentSubmission.deleteMany({});
  console.log(`   ✅ Cleared ${subRes.deletedCount} AssignmentSubmission record(s).`);

  // 5. Delete all Attendance records
  const attRes = await Attendance.deleteMany({});
  console.log(`   ✅ Cleared ${attRes.deletedCount} Attendance record(s).`);

  const staffAttRes = await StaffAttendance.deleteMany({});
  console.log(`   ✅ Cleared ${staffAttRes.deletedCount} StaffAttendance record(s).`);

  // 6. Delete all Live Sessions & Classrooms
  const liveRes = await LiveSession.deleteMany({});
  console.log(`   ✅ Cleared ${liveRes.deletedCount} LiveSession record(s).`);

  // 7. Delete all Payments & Invoices
  const payRes = await Payment.deleteMany({});
  console.log(`   ✅ Cleared ${payRes.deletedCount} Payment record(s).`);

  // 8. Delete all Notifications
  const notifRes = await Notification.deleteMany({});
  console.log(`   ✅ Cleared ${notifRes.deletedCount} Notification record(s).`);

  // 9. Delete all Study Materials
  const matRes = await Material.deleteMany({});
  console.log(`   ✅ Cleared ${matRes.deletedCount} Material record(s).`);

  // 10. Delete all Batches & Subjects
  const batchRes = await Batch.deleteMany({});
  console.log(`   ✅ Cleared ${batchRes.deletedCount} Batch record(s).`);

  const subjRes = await Subject.deleteMany({});
  console.log(`   ✅ Cleared ${subjRes.deletedCount} Subject record(s).`);

  // 11. Delete all Tests & Test Results
  const testRes = await Test.deleteMany({});
  console.log(`   ✅ Cleared ${testRes.deletedCount} Test record(s).`);

  const testResultRes = await TestResult.deleteMany({});
  console.log(`   ✅ Cleared ${testResultRes.deletedCount} TestResult record(s).`);

  // 12. Delete other audit & communication logs
  await Announcement.deleteMany({});
  await AuditLog.deleteMany({});
  await Inquiry.deleteMany({});
  await ParentCommunication.deleteMany({});
  await StudentReportHistory.deleteMany({});
  await TeacherRemark.deleteMany({});
  console.log("   ✅ Cleared announcements, audit logs, inquiries, and teacher remarks.");

  // 13. Initialize clean default SystemSettings
  await SystemSettings.deleteMany({});
  await SystemSettings.create({
    instituteName: "Mantif Tutoring",
    companyName: "Mantif Education Pvt. Ltd.",
    upiId: "acuity.tutoring@upi",
    monthlyFee: 299,
    academicYear: "2025-2026",
    contactEmail: "info@mantif.com",
    contactPhone: "+91 98427 43538",
  });
  console.log("   ✅ Initialized clean default SystemSettings.");

  // 14. Final Database Audit
  console.log("\n==========================================");
  console.log("🌟 FINAL PURIFIED MONGODB ATLAS STATE:");
  console.log("==========================================");
  const remainingUsers = await User.find().lean();
  console.log(`👥 Remaining Users (${remainingUsers.length}):`);
  remainingUsers.forEach((u) => {
    console.log(`   - ${u.name} (${u.email}) [Role: ${u.role}]`);
  });
  console.log(`🎓 Student Profiles: ${await StudentProfile.countDocuments()}`);
  console.log(`👨‍🏫 Teacher Profiles: ${await TeacherProfile.countDocuments()}`);
  console.log(`📝 Assignments: ${await Assignment.countDocuments()}`);
  console.log(`📑 Submissions: ${await AssignmentSubmission.countDocuments()}`);
  console.log(`📚 Materials: ${await Material.countDocuments()}`);
  console.log(`🎥 Live Sessions: ${await LiveSession.countDocuments()}`);
  console.log(`💳 Payments: ${await Payment.countDocuments()}`);
  console.log("==========================================");
  console.log("🎉 MongoDB Atlas is now completely clean with ONLY Admin credentials!");

  process.exit(0);
}

wipeDatabaseKeepAdminOnly().catch((err) => {
  console.error("❌ Wipe failed:", err);
  process.exit(1);
});
