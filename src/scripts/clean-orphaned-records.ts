import mongoose from "mongoose";
import dotenv from "dotenv";
import connectToDatabase from "../lib/db/mongoose";
import User from "../models/User";
import Attendance from "../models/Attendance";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Payment from "../models/Payment";
import StudentProfile from "../models/StudentProfile";
import TeacherProfile from "../models/TeacherProfile";

dotenv.config();

async function cleanupOrphanedRecords() {
  await connectToDatabase();
  console.log("=== CHECKING USERS IN DATABASE ===");
  const allUsers = await User.find().lean();
  const validUserIds = allUsers.map((u) => u._id.toString());
  console.log(`Found ${validUserIds.length} valid users:`, allUsers.map(u => ({ name: u.name, role: u.role, id: u._id })));

  // Find and delete orphaned attendance records
  const allAttendance = await Attendance.find().lean();
  console.log(`Total Attendance Records: ${allAttendance.length}`);
  
  let deletedAttendanceCount = 0;
  for (const att of allAttendance) {
    const studentIdStr = att.studentId?.toString();
    if (!studentIdStr || !validUserIds.includes(studentIdStr)) {
      console.log(`Deleting orphaned attendance record: id=${att._id}, studentId=${studentIdStr}`);
      await Attendance.findByIdAndDelete(att._id);
      deletedAttendanceCount++;
    }
  }
  console.log(`Cleaned up ${deletedAttendanceCount} orphaned attendance records.`);

  // Find and delete orphaned submissions
  const allSubmissions = await AssignmentSubmission.find().lean();
  let deletedSubmissionsCount = 0;
  for (const sub of allSubmissions) {
    const studentIdStr = sub.studentId?.toString();
    if (!studentIdStr || !validUserIds.includes(studentIdStr)) {
      await AssignmentSubmission.findByIdAndDelete(sub._id);
      deletedSubmissionsCount++;
    }
  }
  console.log(`Cleaned up ${deletedSubmissionsCount} orphaned assignment submissions.`);

  // Find and delete orphaned payments
  const allPayments = await Payment.find().lean();
  let deletedPaymentsCount = 0;
  for (const p of allPayments) {
    const studentIdStr = p.studentId?.toString();
    if (!studentIdStr || !validUserIds.includes(studentIdStr)) {
      await Payment.findByIdAndDelete(p._id);
      deletedPaymentsCount++;
    }
  }
  console.log(`Cleaned up ${deletedPaymentsCount} orphaned payments.`);

  // Find and delete orphaned student profiles
  const allStudentProfiles = await StudentProfile.find().lean();
  let deletedProfilesCount = 0;
  for (const sp of allStudentProfiles) {
    const userIdStr = sp.userId?.toString();
    if (!userIdStr || !validUserIds.includes(userIdStr)) {
      await StudentProfile.findByIdAndDelete(sp._id);
      deletedProfilesCount++;
    }
  }
  console.log(`Cleaned up ${deletedProfilesCount} orphaned student profiles.`);

  // Check remaining attendance records
  const remainingAttendance = await Attendance.find().populate("studentId", "name email").lean();
  console.log("\n=== REMAINING ATTENDANCE RECORDS ===");
  console.log(remainingAttendance.map((a: any) => ({
    id: a._id.toString(),
    studentName: a.studentId?.name,
    email: a.studentId?.email,
    status: a.status,
  })));

  process.exit(0);
}

cleanupOrphanedRecords().catch((err) => {
  console.error(err);
  process.exit(1);
});
