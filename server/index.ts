import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { adaptRoute } from "./adapter";
import connectToDatabase from "../src/lib/db/mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── AUTH ROUTES ──
import * as AuthLogin from "../src/app/api/auth/login/route";
import * as AuthLogout from "../src/app/api/auth/logout/route";
import * as AuthMe from "../src/app/api/auth/me/route";
import * as AuthRegisterStudent from "../src/app/api/auth/register/student/route";
import * as AuthRegisterTeacher from "../src/app/api/auth/register/teacher/route";

app.post("/api/auth/login", adaptRoute(AuthLogin.POST));
app.post("/api/auth/logout", adaptRoute(AuthLogout.POST));
app.get("/api/auth/me", adaptRoute(AuthMe.GET));
app.post("/api/auth/register/student", adaptRoute(AuthRegisterStudent.POST));
app.post("/api/auth/register/teacher", adaptRoute(AuthRegisterTeacher.POST));

// ── STUDENT ROUTES ──
import * as StudentDashboard from "../src/app/api/student/dashboard/route";
import * as StudentClasses from "../src/app/api/student/classes/route";
import * as StudentMaterials from "../src/app/api/student/materials/route";
import * as StudentAssignments from "../src/app/api/student/assignments/route";
import * as StudentSubmitAssignment from "../src/app/api/student/submit-assignment/route";
import * as StudentAttendance from "../src/app/api/student/attendance/route";
import * as StudentPayments from "../src/app/api/student/payments/route";
import * as StudentPaymentStatus from "../src/app/api/student/payments/status/route";
import * as StudentPaymentStream from "../src/app/api/student/payments/stream/route";

app.get("/api/student/dashboard", adaptRoute(StudentDashboard.GET));
app.get("/api/student/classes", adaptRoute(StudentClasses.GET));
app.get("/api/student/materials", adaptRoute(StudentMaterials.GET));
app.get("/api/student/assignments", adaptRoute(StudentAssignments.GET));
app.post("/api/student/submit-assignment", adaptRoute(StudentSubmitAssignment.POST));
app.get("/api/student/attendance", adaptRoute(StudentAttendance.GET));
app.get("/api/student/payments", adaptRoute(StudentPayments.GET));
app.post("/api/student/payments", adaptRoute(StudentPayments.POST));
app.get("/api/student/payments/status", adaptRoute(StudentPaymentStatus.GET));
app.get("/api/student/payments/stream", adaptRoute(StudentPaymentStream.GET));

// ── TEACHER ROUTES ──
import * as TeacherDashboard from "../src/app/api/teacher/dashboard/route";
import * as TeacherMaterials from "../src/app/api/teacher/materials/route";
import * as TeacherAssignments from "../src/app/api/teacher/assignments/route";
import * as TeacherStudents from "../src/app/api/teacher/students/route";
import * as TeacherScheduleSwap from "../src/app/api/teacher/schedule/swap/route";
import * as TeacherScheduleReschedule from "../src/app/api/teacher/schedule/reschedule/route";

app.get("/api/teacher/dashboard", adaptRoute(TeacherDashboard.GET));
app.get("/api/teacher/materials", adaptRoute(TeacherMaterials.GET));
app.post("/api/teacher/materials", adaptRoute(TeacherMaterials.POST));
app.get("/api/teacher/assignments", adaptRoute(TeacherAssignments.GET));
app.post("/api/teacher/assignments", adaptRoute(TeacherAssignments.POST));
app.get("/api/teacher/students", adaptRoute(TeacherStudents.GET));
app.post("/api/teacher/schedule/swap", adaptRoute(TeacherScheduleSwap.POST));
app.patch("/api/teacher/schedule/reschedule", adaptRoute(TeacherScheduleReschedule.PATCH));

// ── ADMIN ROUTES ──
import * as AdminDashboard from "../src/app/api/admin/dashboard/route";
import * as AdminStudents from "../src/app/api/admin/students/route";
import * as AdminTeachers from "../src/app/api/admin/teachers/route";
import * as AdminBatches from "../src/app/api/admin/batches/route";
import * as AdminClasses from "../src/app/api/admin/classes/route";
import * as AdminAttendance from "../src/app/api/admin/attendance/route";
import * as AdminStaffAttendance from "../src/app/api/admin/staff-attendance/route";
import * as AdminFinance from "../src/app/api/admin/finance/route";
import * as AdminAnalytics from "../src/app/api/admin/analytics/route";
import * as AdminSettings from "../src/app/api/admin/settings/route";
import * as AdminAuditLogs from "../src/app/api/admin/audit-logs/route";

app.get("/api/admin/dashboard", adaptRoute(AdminDashboard.GET));
app.get("/api/admin/students", adaptRoute(AdminStudents.GET));
app.get("/api/admin/teachers", adaptRoute(AdminTeachers.GET));
app.patch("/api/admin/teachers", adaptRoute(AdminTeachers.PATCH));
app.get("/api/admin/batches", adaptRoute(AdminBatches.GET));
app.post("/api/admin/batches", adaptRoute(AdminBatches.POST));
app.delete("/api/admin/batches", adaptRoute(AdminBatches.DELETE));
app.get("/api/admin/classes", adaptRoute(AdminClasses.GET));
app.get("/api/admin/attendance", adaptRoute(AdminAttendance.GET));
app.get("/api/admin/staff-attendance", adaptRoute(AdminStaffAttendance.GET));
app.get("/api/admin/finance", adaptRoute(AdminFinance.GET));
app.patch("/api/admin/finance", adaptRoute(AdminFinance.PATCH));
app.get("/api/admin/analytics", adaptRoute(AdminAnalytics.GET));
app.get("/api/admin/settings", adaptRoute(AdminSettings.GET));
app.post("/api/admin/settings", adaptRoute(AdminSettings.POST));
app.get("/api/admin/audit-logs", adaptRoute(AdminAuditLogs.GET));

// ── CLASSES & BATCHES & SEED ──
import * as ClassesRoute from "../src/app/api/classes/route";
import * as ClassDetailRoute from "../src/app/api/classes/[id]/route";
import * as ClassAttendanceRoute from "../src/app/api/classes/[id]/attendance/route";
import * as ClassPublishRoute from "../src/app/api/classes/[id]/publish/route";
import * as ClassStartRoute from "../src/app/api/classes/[id]/start/route";
import * as ClassCancelRoute from "../src/app/api/classes/[id]/cancel/route";
import * as BatchesRoute from "../src/app/api/batches/route";
import * as SeedRoute from "../src/app/api/seed/route";

app.get("/api/classes", adaptRoute(ClassesRoute.GET));
app.post("/api/classes", adaptRoute(ClassesRoute.POST));
app.get("/api/classes/:id", adaptRoute(ClassDetailRoute.GET));
app.delete("/api/classes/:id", adaptRoute(ClassDetailRoute.DELETE));
app.get("/api/classes/:id/attendance", adaptRoute(ClassAttendanceRoute.GET));
app.post("/api/classes/:id/attendance", adaptRoute(ClassAttendanceRoute.POST));
app.put("/api/classes/:id/publish", adaptRoute(ClassPublishRoute.PUT));
app.put("/api/classes/:id/start", adaptRoute(ClassStartRoute.PUT));
app.put("/api/classes/:id/cancel", adaptRoute(ClassCancelRoute.PUT));
app.get("/api/batches", adaptRoute(BatchesRoute.GET));
app.get("/api/seed", adaptRoute(SeedRoute.GET));

// Start server and connect DB
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Acuity API Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
