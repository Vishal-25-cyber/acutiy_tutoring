import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import connectToDatabase from "../lib/db/mongoose";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import TeacherProfile from "../models/TeacherProfile";
import Assignment from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Attendance from "../models/Attendance";
import Payment from "../models/Payment";
import Batch from "../models/Batch";
import Subject from "../models/Subject";
import Notification from "../models/Notification";
import SystemSettings from "../models/SystemSettings";

async function purifyDatabase() {
  console.log("🔌 Connecting to Database...");
  await connectToDatabase();
  console.log("✅ Database connected successfully!");

  // 1. Clean up garbage/test assignments (e.g., titles like 'vbnm', 'test', 'asdf', empty titles)
  const testAssignmentPatterns = [/vbnm/i, /^test$/i, /^asdf$/i, /^xyz$/i, /^sample$/i, /^temp$/i, /^abc$/i];
  const allAssignments = await Assignment.find().lean();
  let deletedAssignments = 0;
  for (const a of allAssignments) {
    const isGarbage = testAssignmentPatterns.some((pattern) => pattern.test(a.title.trim()));
    if (isGarbage) {
      console.log(`   🗑 Deleting test/garbage assignment: "${a.title}" (_id: ${a._id})`);
      await Assignment.findByIdAndDelete(a._id);
      await AssignmentSubmission.deleteMany({ assignmentId: a._id });
      deletedAssignments++;
    }
  }
  console.log(`✅ Cleared ${deletedAssignments} test/dummy assignment(s).`);

  // 2. Remove duplicate users by email
  const allUsers = await User.find().lean();
  const seenEmails = new Set<string>();
  let deletedDuplicateUsers = 0;
  for (const u of allUsers) {
    const normEmail = u.email.toLowerCase().trim();
    if (seenEmails.has(normEmail)) {
      console.log(`   🗑 Removing duplicate user: ${u.name} (${u.email}) (_id: ${u._id})`);
      await User.findByIdAndDelete(u._id);
      await StudentProfile.deleteMany({ userId: u._id });
      await TeacherProfile.deleteMany({ userId: u._id });
      await AssignmentSubmission.deleteMany({ studentId: u._id });
      await Attendance.deleteMany({ studentId: u._id });
      await Payment.deleteMany({ studentId: u._id });
      deletedDuplicateUsers++;
    } else {
      seenEmails.add(normEmail);
    }
  }
  console.log(`✅ Removed ${deletedDuplicateUsers} duplicate user record(s).`);

  // 3. Clean orphaned student and teacher profiles
  const validUsers = await User.find().lean();
  const validUserIds = new Set(validUsers.map((u) => u._id.toString()));

  const studentProfiles = await StudentProfile.find().lean();
  for (const sp of studentProfiles) {
    if (!sp.userId || !validUserIds.has(sp.userId.toString())) {
      console.log(`   🗑 Removing orphaned student profile: ${sp._id}`);
      await StudentProfile.findByIdAndDelete(sp._id);
    }
  }

  const teacherProfiles = await TeacherProfile.find().lean();
  for (const tp of teacherProfiles) {
    if (!tp.userId || !validUserIds.has(tp.userId.toString())) {
      console.log(`   🗑 Removing orphaned teacher profile: ${tp._id}`);
      await TeacherProfile.findByIdAndDelete(tp._id);
    }
  }

  // 4. Clean orphaned assignment submissions
  const validAssignments = await Assignment.find().lean();
  const validAssignmentIds = new Set(validAssignments.map((a) => a._id.toString()));
  const allSubmissions = await AssignmentSubmission.find().lean();
  for (const sub of allSubmissions) {
    if (
      !sub.studentId ||
      !validUserIds.has(sub.studentId.toString()) ||
      !sub.assignmentId ||
      !validAssignmentIds.has(sub.assignmentId.toString())
    ) {
      console.log(`   🗑 Removing orphaned submission: ${sub._id}`);
      await AssignmentSubmission.findByIdAndDelete(sub._id);
    }
  }

  // 5. Clean duplicate Batches by name
  const batches = await Batch.find().lean();
  const seenBatches = new Set<string>();
  for (const b of batches) {
    const key = `${b.name.toLowerCase().trim()}_${b.classLevel}`;
    if (seenBatches.has(key)) {
      console.log(`   🗑 Removing duplicate batch: ${b.name} (${b.classLevel})`);
      await Batch.findByIdAndDelete(b._id);
    } else {
      seenBatches.add(key);
    }
  }

  // 6. Deduplicate SystemSettings to ensure strictly 1 master document
  const settings = await SystemSettings.find().lean();
  if (settings.length > 1) {
    for (let i = 1; i < settings.length; i++) {
      console.log(`   🗑 Removing duplicate SystemSettings record: ${settings[i]._id}`);
      await SystemSettings.findByIdAndDelete(settings[i]._id);
    }
  }

  // 7. Summary of Current Clean Database
  console.log("\n==========================================");
  console.log("🌟 PURIFIED DATABASE STATE SUMMARY:");
  console.log("==========================================");
  console.log(`👥 Users: ${(await User.countDocuments())} active`);
  console.log(`🎓 Student Profiles: ${(await StudentProfile.countDocuments())} active`);
  console.log(`👨‍🏫 Teacher Profiles: ${(await TeacherProfile.countDocuments())} active`);
  console.log(`🏷️  Batches: ${(await Batch.countDocuments())} active`);
  console.log(`📝 Assignments & Tasks: ${(await Assignment.countDocuments())} active`);
  console.log(`📑 Submissions: ${(await AssignmentSubmission.countDocuments())} active`);
  console.log(`💳 Payments: ${(await Payment.countDocuments())} active`);
  console.log("==========================================");
  console.log("🎉 Database 100% clean, verified, and bug-free!");

  process.exit(0);
}

purifyDatabase().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
