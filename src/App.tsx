import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public / Auth Pages
import LandingPage from "./app/page";
import LoginPage from "./app/(auth)/login/page";
import RegisterStudentPage from "./app/(auth)/register/student/page";
import RegisterTeacherPage from "./app/(auth)/register/teacher/page";

// Student Portal
import StudentLayout from "./app/(portal)/student/layout";
import StudentDashboardPage from "./app/(portal)/student/dashboard/page";
import StudentClassesPage from "./app/(portal)/student/classes/page";
import StudentMaterialsPage from "./app/(portal)/student/materials/page";
import StudentAssignmentsPage from "./app/(portal)/student/assignments/page";
import StudentAttendancePage from "./app/(portal)/student/attendance/page";
import StudentFeesPage from "./app/(portal)/student/fees/page";

// Faculty / Teacher Portal
import TeacherLayout from "./app/(portal)/teacher/layout";
import TeacherDashboardPage from "./app/(portal)/teacher/dashboard/page";
import TeacherSchedulePage from "./app/(portal)/teacher/schedule/page";
import TeacherLiveClassCreatePage from "./app/(portal)/teacher/live-class/create/page";
import TeacherMaterialsPage from "./app/(portal)/teacher/materials/page";
import TeacherAssignmentsPage from "./app/(portal)/teacher/assignments/page";
import TeacherStudentsPage from "./app/(portal)/teacher/students/page";
import TeacherAttendancePage from "./app/(portal)/teacher/attendance/page";
import TeacherClassAttendanceDetailPage from "./app/(portal)/teacher/attendance/[classId]/page";

// Admin Portal
import AdminLayout from "./app/(portal)/admin/layout";
import AdminDashboardPage from "./app/(portal)/admin/dashboard/page";
import AdminStudentsPage from "./app/(portal)/admin/students/page";
import AdminTeachersPage from "./app/(portal)/admin/teachers/page";
import AdminBatchesPage from "./app/(portal)/admin/batches/page";
import AdminClassesPage from "./app/(portal)/admin/classes/page";
import AdminAttendancePage from "./app/(portal)/admin/attendance/page";
import AdminStaffAttendancePage from "./app/(portal)/admin/staff-attendance/page";
import AdminFinancePage from "./app/(portal)/admin/finance/page";
import AdminAnalyticsPage from "./app/(portal)/admin/analytics/page";
import AdminSettingsPage from "./app/(portal)/admin/settings/page";
import AdminAuditLogsPage from "./app/(portal)/admin/audit-logs/page";

// Live Classroom
import ClassroomPage from "./app/classroom/[classId]/page";

export default function App() {
  return (
    <Routes>
      {/* ── Public & Auth Routes ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/student" element={<RegisterStudentPage />} />
      <Route path="/register/teacher" element={<RegisterTeacherPage />} />

      {/* ── Student Portal Routes ── */}
      <Route
        path="/student/dashboard"
        element={
          <StudentLayout>
            <StudentDashboardPage />
          </StudentLayout>
        }
      />
      <Route
        path="/student/classes"
        element={
          <StudentLayout>
            <StudentClassesPage />
          </StudentLayout>
        }
      />
      <Route
        path="/student/materials"
        element={
          <StudentLayout>
            <StudentMaterialsPage />
          </StudentLayout>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <StudentLayout>
            <StudentAssignmentsPage />
          </StudentLayout>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <StudentLayout>
            <StudentAttendancePage />
          </StudentLayout>
        }
      />
      <Route
        path="/student/fees"
        element={
          <StudentLayout>
            <StudentFeesPage />
          </StudentLayout>
        }
      />

      {/* ── Teacher Portal Routes ── */}
      <Route
        path="/teacher/dashboard"
        element={
          <TeacherLayout>
            <TeacherDashboardPage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/schedule"
        element={
          <TeacherLayout>
            <TeacherSchedulePage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/live-class/create"
        element={
          <TeacherLayout>
            <TeacherLiveClassCreatePage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/materials"
        element={
          <TeacherLayout>
            <TeacherMaterialsPage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/assignments"
        element={
          <TeacherLayout>
            <TeacherAssignmentsPage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <TeacherLayout>
            <TeacherStudentsPage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <TeacherLayout>
            <TeacherAttendancePage />
          </TeacherLayout>
        }
      />
      <Route
        path="/teacher/attendance/:classId"
        element={
          <TeacherLayout>
            <TeacherClassAttendanceDetailPage />
          </TeacherLayout>
        }
      />

      {/* ── Admin Portal Routes ── */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/students"
        element={
          <AdminLayout>
            <AdminStudentsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <AdminLayout>
            <AdminTeachersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/batches"
        element={
          <AdminLayout>
            <AdminBatchesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <AdminLayout>
            <AdminClassesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <AdminLayout>
            <AdminAttendancePage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/staff-attendance"
        element={
          <AdminLayout>
            <AdminStaffAttendancePage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/finance"
        element={
          <AdminLayout>
            <AdminFinancePage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminLayout>
            <AdminAnalyticsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminLayout>
            <AdminAuditLogsPage />
          </AdminLayout>
        }
      />

      {/* ── Live Classroom Route ── */}
      <Route path="/classroom/:classId" element={<ClassroomPage />} />

      {/* ── Fallback Redirect ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
