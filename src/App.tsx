import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Public / Landing Page & Contact
import LandingPage from "./app/page";
import ContactPage from "./app/contact/page";

// Student Portal
import StudentLayout from "./app/(portal)/student/layout";
import StudentDashboardPage from "./app/(portal)/student/dashboard/page";
import StudentClassesPage from "./app/(portal)/student/classes/page";
import StudentMaterialsPage from "./app/(portal)/student/materials/page";
import StudentAssignmentsPage from "./app/(portal)/student/assignments/page";
import StudentAttendancePage from "./app/(portal)/student/attendance/page";
import StudentFeesPage from "./app/(portal)/student/fees/page";
import StudentPerformancePage from "./app/(portal)/student/performance/page";
import StudentParentViewPage from "./app/(portal)/student/parent-view/page";
import StudentAiTutorPage from "./app/(portal)/student/ai-tutor/page";
import StudentClassroomSessionPage from "./app/(portal)/student/classroom/[sessionId]/page";

// Faculty / Teacher Portal
import TeacherLayout from "./app/(portal)/teacher/layout";
import TeacherDashboardPage from "./app/(portal)/teacher/dashboard/page";
import TeacherSchedulePage from "./app/(portal)/teacher/schedule/page";
import TeacherLiveClassCreatePage from "./app/(portal)/teacher/live-class/create/page";
import TeacherMaterialsPage from "./app/(portal)/teacher/materials/page";
import TeacherAssignmentsPage from "./app/(portal)/teacher/assignments/page";
import TeacherStudentsPage from "./app/(portal)/teacher/students/page";
import TeacherStudentReportsPage from "./app/(portal)/teacher/reports/page";
import TeacherAttendancePage from "./app/(portal)/teacher/attendance/page";
import TeacherClassAttendanceDetailPage from "./app/(portal)/teacher/attendance/[classId]/page";
import TeacherClassroomSessionPage from "./app/(portal)/teacher/classroom/[sessionId]/page";

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

// Live Classroom
import ClassroomPage from "./app/classroom/[classId]/page";

function RouteSEOAndScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll(
      "#student-portal-scroll-area, #teacher-portal-scroll-area, #admin-portal-scroll-area"
    );
    scrollContainers.forEach((el) => {
      el.scrollTop = 0;
    });

    // Dynamic Title per route
    let pageTitle = "Mantif — Human x Artificial Intelligence | Online Tutoring & Learning Platform";
    let isPrivate = false;

    if (pathname === "/contact") {
      pageTitle = "Contact & Admissions | Mantif Tutoring";
    } else if (pathname.startsWith("/student")) {
      isPrivate = true;
      if (pathname.includes("/dashboard")) pageTitle = "Student Dashboard | Mantif";
      else if (pathname.includes("/classes")) pageTitle = "Live Classes & Timetable | Mantif";
      else if (pathname.includes("/materials")) pageTitle = "Study Materials & Notes | Mantif";
      else if (pathname.includes("/assignments")) pageTitle = "Assignments & Proctored Tests | Mantif";
      else if (pathname.includes("/attendance")) pageTitle = "Attendance Record | Mantif";
      else if (pathname.includes("/fees")) pageTitle = "Fee Receipts & Billing | Mantif";
      else if (pathname.includes("/performance")) pageTitle = "Academic Performance | Mantif";
      else pageTitle = "Student Portal | Mantif";
    } else if (pathname.startsWith("/teacher")) {
      isPrivate = true;
      if (pathname.includes("/dashboard")) pageTitle = "Faculty Dashboard | Mantif";
      else if (pathname.includes("/schedule")) pageTitle = "Teaching Schedule & Timetable | Mantif";
      else if (pathname.includes("/materials")) pageTitle = "Study Resources | Mantif";
      else if (pathname.includes("/assignments")) pageTitle = "Assignments & Grading | Mantif";
      else if (pathname.includes("/students")) pageTitle = "Student Roster | Mantif";
      else if (pathname.includes("/reports")) pageTitle = "Student Performance Reports | Mantif";
      else pageTitle = "Faculty Portal | Mantif";
    } else if (pathname.startsWith("/admin")) {
      isPrivate = true;
      pageTitle = "Administration Console | Mantif";
    } else if (pathname.startsWith("/classroom")) {
      isPrivate = true;
      pageTitle = "Live Interactive Classroom | Mantif";
    }

    document.title = pageTitle;

    // Canonical link tag pointing to mantif.com
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://mantif.com${pathname === "/" ? "" : pathname}`);

    // Robots meta tag: public index for landing/contact, noindex for private authenticated portals
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    if (isPrivate) {
      metaRobots.setAttribute("content", "noindex, nofollow");
    } else {
      metaRobots.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <RouteSEOAndScroll />
      <Routes>
        {/* ── Public Landing Page & Auth Redirects ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/register/student" element={<Navigate to="/" replace />} />
        <Route path="/register/teacher" element={<Navigate to="/" replace />} />

        {/* ── Student Portal Nested Routes (Persistent Layout) ── */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="classes" element={<StudentClassesPage />} />
          <Route path="materials" element={<StudentMaterialsPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="attendance" element={<StudentAttendancePage />} />
          <Route path="fees" element={<StudentFeesPage />} />
          <Route path="performance" element={<StudentPerformancePage />} />
          <Route path="parent-view" element={<StudentParentViewPage />} />
          <Route path="ai-tutor" element={<StudentAiTutorPage />} />
          <Route path="classroom/:sessionId" element={<StudentClassroomSessionPage />} />
        </Route>

        {/* ── Teacher Portal Nested Routes (Persistent Layout) ── */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboardPage />} />
          <Route path="reports" element={<TeacherStudentReportsPage />} />
          <Route path="schedule" element={<TeacherSchedulePage />} />
          <Route path="live-class/create" element={<TeacherLiveClassCreatePage />} />
          <Route path="materials" element={<TeacherMaterialsPage />} />
          <Route path="assignments" element={<TeacherAssignmentsPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route path="attendance/:classId" element={<TeacherClassAttendanceDetailPage />} />
          <Route path="classroom/:sessionId" element={<TeacherClassroomSessionPage />} />
        </Route>

        {/* ── Admin Portal Nested Routes (Persistent Layout) ── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="reports" element={<TeacherStudentReportsPage />} />
          <Route path="students" element={<AdminStudentsPage />} />
          <Route path="teachers" element={<AdminTeachersPage />} />
          <Route path="batches" element={<AdminBatchesPage />} />
          <Route path="classes" element={<AdminClassesPage />} />
          <Route path="attendance" element={<AdminAttendancePage />} />
          <Route path="staff-attendance" element={<AdminStaffAttendancePage />} />
          <Route path="finance" element={<AdminFinancePage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* ── Live Classroom Route ── */}
        <Route path="/classroom/:classId" element={<ClassroomPage />} />

        {/* ── Fallback Redirect ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

