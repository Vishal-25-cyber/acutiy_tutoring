import mongoose from "mongoose";
import dotenv from "dotenv";
import connectToDatabase from "../lib/db/mongoose";
import User from "../models/User";
import TeacherProfile from "../models/TeacherProfile";
import StudentProfile from "../models/StudentProfile";

dotenv.config();

async function verifyDatabase() {
  await connectToDatabase();
  console.log("=== CURRENT USERS IN MONGODB ===");
  const users = await User.find().select("_id name email role status").lean();
  console.table(users);

  console.log("\n=== CURRENT TEACHER PROFILES IN MONGODB ===");
  const teachers = await TeacherProfile.find().populate("userId", "name email").lean();
  console.log(teachers.map(t => ({
    _id: t._id.toString(),
    teacherName: (t.userId as any)?.name || "NO_USER_LINKED",
    email: (t.userId as any)?.email || "NO_EMAIL",
    qualification: t.qualification,
    approvalStatus: t.approvalStatus,
  })));

  console.log("\n=== CURRENT STUDENT PROFILES IN MONGODB ===");
  const students = await StudentProfile.find().populate("userId", "name email").lean();
  console.log(students.map(s => ({
    _id: s._id.toString(),
    studentName: (s.userId as any)?.name || "NO_USER_LINKED",
    email: (s.userId as any)?.email || "NO_EMAIL",
    currentClass: s.currentClass,
    board: s.board,
  })));

  process.exit(0);
}

verifyDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});
