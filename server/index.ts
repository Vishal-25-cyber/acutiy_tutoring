import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { adaptRoute } from "./adapter";
import connectToDatabase from "../src/lib/db/mongoose";

// Live Acuity API Server
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import * as AuthLogin from "../src/app/api/auth/login/route";
import * as AuthLogout from "../src/app/api/auth/logout/route";
import * as AuthMe from "../src/app/api/auth/me/route";
import * as AuthRegister from "../src/app/api/auth/register/route";
import * as AuthRegisterStudent from "../src/app/api/auth/register/student/route";
import * as AuthRegisterTeacher from "../src/app/api/auth/register/teacher/route";

app.post("/api/auth/login", adaptRoute(AuthLogin.POST));
app.post("/api/auth/logout", adaptRoute(AuthLogout.POST));
app.get("/api/auth/me", adaptRoute(AuthMe.GET));
app.post("/api/auth/register", adaptRoute(AuthRegister.POST));
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
import * as StudentPerformance from "../src/app/api/student/performance/route";
import * as StudentParentView from "../src/app/api/student/parent-view/route";
import * as StudentAiAssistant from "../src/app/api/student/ai-assistant/route";

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
app.get("/api/student/performance", adaptRoute(StudentPerformance.GET));
app.get("/api/student/parent-view", adaptRoute(StudentParentView.GET));
app.post("/api/student/ai-assistant", adaptRoute(StudentAiAssistant.POST));

// ── TEACHER ROUTES ──
import * as TeacherDashboard from "../src/app/api/teacher/dashboard/route";
import * as TeacherMaterials from "../src/app/api/teacher/materials/route";
import * as TeacherMaterialDetail from "../src/app/api/teacher/materials/[id]/route";
import * as TeacherAssignments from "../src/app/api/teacher/assignments/route";
import * as TeacherStudents from "../src/app/api/teacher/students/route";
import * as TeacherScheduleSwap from "../src/app/api/teacher/schedule/swap/route";
import * as TeacherScheduleReschedule from "../src/app/api/teacher/schedule/reschedule/route";
import * as TeacherEvaluate from "../src/app/api/teacher/evaluate/route";
import * as TeacherClasses from "../src/app/api/teacher/classes/route";
import * as TeacherAttendance from "../src/app/api/teacher/attendance/route";
import * as TeacherLiveSession from "../src/app/api/teacher/live-session/route";

app.get("/api/teacher/dashboard", adaptRoute(TeacherDashboard.GET));
app.get("/api/teacher/materials", adaptRoute(TeacherMaterials.GET));
app.post("/api/teacher/materials", adaptRoute(TeacherMaterials.POST));
app.delete("/api/teacher/materials", adaptRoute(TeacherMaterials.DELETE));
app.get("/api/teacher/materials/:id", adaptRoute(TeacherMaterialDetail.GET));
app.delete("/api/teacher/materials/:id", adaptRoute(TeacherMaterialDetail.DELETE));
app.get("/api/teacher/assignments", adaptRoute(TeacherAssignments.GET));
app.post("/api/teacher/assignments", adaptRoute(TeacherAssignments.POST));
app.get("/api/teacher/students", adaptRoute(TeacherStudents.GET));
app.patch("/api/teacher/students", adaptRoute(TeacherStudents.PATCH));
app.post("/api/teacher/schedule/swap", adaptRoute(TeacherScheduleSwap.POST));
app.patch("/api/teacher/schedule/reschedule", adaptRoute(TeacherScheduleReschedule.PATCH));
app.post("/api/teacher/evaluate", adaptRoute(TeacherEvaluate.POST));
app.get("/api/teacher/classes", adaptRoute(TeacherClasses.GET));
app.get("/api/teacher/attendance", adaptRoute(TeacherAttendance.GET));
app.post("/api/teacher/attendance", adaptRoute(TeacherAttendance.POST));
app.post("/api/teacher/live-session", adaptRoute(TeacherLiveSession.POST));

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

app.get("/api/admin/dashboard", adaptRoute(AdminDashboard.GET));

app.get("/api/admin/students", adaptRoute(AdminStudents.GET));
app.post("/api/admin/students", adaptRoute(AdminStudents.POST));
app.patch("/api/admin/students", adaptRoute(AdminStudents.PATCH));
app.delete("/api/admin/students", adaptRoute(AdminStudents.DELETE));

app.get("/api/admin/teachers", adaptRoute(AdminTeachers.GET));
app.patch("/api/admin/teachers", adaptRoute(AdminTeachers.PATCH));
app.delete("/api/admin/teachers", adaptRoute(AdminTeachers.DELETE));

app.get("/api/admin/batches", adaptRoute(AdminBatches.GET));
app.post("/api/admin/batches", adaptRoute(AdminBatches.POST));
app.delete("/api/admin/batches", adaptRoute(AdminBatches.DELETE));
app.get("/api/admin/classes", adaptRoute(AdminClasses.GET));
app.get("/api/admin/attendance", adaptRoute(AdminAttendance.GET));
app.get("/api/admin/staff-attendance", adaptRoute(AdminStaffAttendance.GET));
app.post("/api/admin/staff-attendance", adaptRoute(AdminStaffAttendance.POST));
app.get("/api/admin/finance", adaptRoute(AdminFinance.GET));
app.patch("/api/admin/finance", adaptRoute(AdminFinance.PATCH));
app.get("/api/admin/analytics", adaptRoute(AdminAnalytics.GET));
app.get("/api/admin/settings", adaptRoute(AdminSettings.GET));
app.post("/api/admin/settings", adaptRoute(AdminSettings.POST));

// ── CLASSES & BATCHES & ATTENDANCE TRACKING ──
import * as ClassesRoute from "../src/app/api/classes/route";
import * as ClassDetailRoute from "../src/app/api/classes/[id]/route";
import * as ClassAttendanceRoute from "../src/app/api/classes/[id]/attendance/route";
import * as ClassPublishRoute from "../src/app/api/classes/[id]/publish/route";
import * as ClassStartRoute from "../src/app/api/classes/[id]/start/route";
import * as ClassCancelRoute from "../src/app/api/classes/[id]/cancel/route";
import * as ClassJoinRoute from "../src/app/api/classes/[id]/join/route";
import * as ClassEndRoute from "../src/app/api/classes/[id]/end/route";
import * as ClassParticipantsRoute from "../src/app/api/classes/[id]/participants/route";
import * as ClassAdmitRoute from "../src/app/api/classes/[id]/admit/route";
import * as BatchesRoute from "../src/app/api/batches/route";
import * as SeedRoute from "../src/app/api/seed/route";
import * as NotificationsRoute from "../src/app/api/notifications/route";
import * as AttendanceJoinRoute from "../src/app/api/attendance/join/route";
import * as AttendanceLeaveRoute from "../src/app/api/attendance/leave/route";
import * as AttendanceHeartbeatRoute from "../src/app/api/attendance/heartbeat/route";

app.get("/api/classes", adaptRoute(ClassesRoute.GET));
app.post("/api/classes", adaptRoute(ClassesRoute.POST));
app.get("/api/classes/:id", adaptRoute(ClassDetailRoute.GET));
app.delete("/api/classes/:id", adaptRoute(ClassDetailRoute.DELETE));
app.get("/api/classes/:id/attendance", adaptRoute(ClassAttendanceRoute.GET));
app.post("/api/classes/:id/attendance", adaptRoute(ClassAttendanceRoute.POST));
app.put("/api/classes/:id/publish", adaptRoute(ClassPublishRoute.PUT));
app.put("/api/classes/:id/start", adaptRoute(ClassStartRoute.PUT));
app.put("/api/classes/:id/cancel", adaptRoute(ClassCancelRoute.PUT));
app.post("/api/classes/:id/join", adaptRoute(ClassJoinRoute.POST));
app.put("/api/classes/:id/end", adaptRoute(ClassEndRoute.PUT));
app.get("/api/classes/:id/participants", adaptRoute(ClassParticipantsRoute.GET));
app.get("/api/classes/:id/admit", adaptRoute(ClassAdmitRoute.GET));
app.post("/api/classes/:id/admit", adaptRoute(ClassAdmitRoute.POST));
app.put("/api/classes/:id/admit", adaptRoute(ClassAdmitRoute.PUT));
app.get("/api/batches", adaptRoute(BatchesRoute.GET));
app.get("/api/seed", adaptRoute(SeedRoute.GET));
app.post("/api/seed", adaptRoute(SeedRoute.POST));
app.get("/api/notifications", adaptRoute(NotificationsRoute.GET));
app.put("/api/notifications", adaptRoute(NotificationsRoute.PUT));
app.post("/api/attendance/join", adaptRoute(AttendanceJoinRoute.POST));
app.post("/api/attendance/leave", adaptRoute(AttendanceLeaveRoute.POST));
app.post("/api/attendance/heartbeat", adaptRoute(AttendanceHeartbeatRoute.POST));

import * as LivekitTokenRoute from "../src/app/api/livekit/token/route";
import * as LivekitRecordAttendanceRoute from "../src/app/api/livekit/record-attendance/route";
import * as LivekitPollRoute from "../src/app/api/livekit/poll/route";
import * as ClassesUpcomingRoute from "../src/app/api/classes/upcoming/route";
import * as ResetDbRoute from "../src/app/api/reset-db/route";
import * as TestFlowRoute from "../src/app/api/test-flow/route";

app.post("/api/livekit/token", adaptRoute(LivekitTokenRoute.POST));
app.post("/api/livekit/record-attendance", adaptRoute(LivekitRecordAttendanceRoute.POST));
app.post("/api/livekit/poll", adaptRoute(LivekitPollRoute.POST));
app.get("/api/classes/upcoming", adaptRoute(ClassesUpcomingRoute.GET));
app.post("/api/reset-db", adaptRoute(ResetDbRoute.POST));
app.get("/api/test-flow", adaptRoute(TestFlowRoute.GET));

import * as ContactRoute from "../src/app/api/contact/route";

app.post("/api/contact", adaptRoute(ContactRoute.POST));

import path from "path";
import fs from "fs";

// Static SPA Serving for Production (Render / Cloud)
const distPath = path.join(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: any, res: any, next: any) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

// 404 Fallback returning clean JSON instead of HTML for API routes
app.use((req: any, res: any) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global Error Handler returning JSON
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global Server Error:", err);
  res.status(err.status || err.statusCode || 500).json({
    error: err.message || "An internal server error occurred.",
  });
});

// Start HTTP server immediately on PORT so Render passes port binding check
app.listen(PORT, () => {
  console.log(`[Acuity API Server] Running on port ${PORT}`);
  connectToDatabase()
    .then(async () => {
      console.log(`[MongoDB] Connected successfully to Atlas`);
      try {
        const User = (await import("../src/models/User")).default;
        const TeacherProfile = (await import("../src/models/TeacherProfile")).default;

        // Auto-promote Sudeep and faculty accounts to ACTIVE TEACHER
        const sudeepUsers = await User.find({
          $or: [
            { email: "sudeepk.23cse@kongu.edu" },
            { name: /sudeep/i },
          ],
        });

        for (const sudeep of sudeepUsers) {
          if (sudeep.role !== "TEACHER" || sudeep.status !== "ACTIVE") {
            sudeep.role = "TEACHER";
            sudeep.status = "ACTIVE";
            await sudeep.save();
          }
          await TeacherProfile.findOneAndUpdate(
            { userId: sudeep._id },
            {
              $setOnInsert: {
                userId: sudeep._id,
                qualification: "Academic Faculty Specialist",
                specialization: "Mathematics & Science",
                subjects: ["Mathematics", "Science"],
                classesTaught: ["Class 9", "Class 10"],
                experienceYears: 5,
                approvalStatus: "ACTIVE",
              },
              $set: {
                approvalStatus: "ACTIVE",
              },
            },
            { upsert: true, new: true }
          );
        }
        if (sudeepUsers.length > 0) {
          console.log(`[Acuity] Verified ${sudeepUsers.length} faculty account(s) as ACTIVE TEACHER.`);
        }
      } catch (err: any) {
        console.warn("[Acuity] Faculty account verification warning:", err.message);
      }
    })
    .catch((err) => {
      console.error("[MongoDB] Connection warning (check Atlas IP Whitelist 0.0.0.0/0):", err.message);
    });
});
