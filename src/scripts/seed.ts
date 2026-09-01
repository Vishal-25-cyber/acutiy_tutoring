import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import TeacherProfile from "@/models/TeacherProfile";
import Batch from "@/models/Batch";
import Subject from "@/models/Subject";
import LiveSession from "@/models/LiveSession";
import Attendance from "@/models/Attendance";
import StaffAttendance from "@/models/StaffAttendance";
import Material from "@/models/Material";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import Payment from "@/models/Payment";
import Notification from "@/models/Notification";
import Announcement from "@/models/Announcement";
import SystemSettings from "@/models/SystemSettings";
import { hashPassword } from "@/lib/auth/passwords";

export async function runSeed() {
  await connectToDatabase();
  console.log("🌱 Starting Acuity Tutoring Database Seeder...");

  // 1. System Settings
  await SystemSettings.deleteMany({});
  const settings = await SystemSettings.create({
    companyName: "Acuity Tutoring & Live Learning",
    logoUrl: "",
    supportPhone1: "+91 98765 43210",
    supportPhone2: "+91 98765 43211",
    supportPhone3: "+91 98765 43212",
    supportEmail: "support@acuity.edu",
    defaultGracePeriodMinutes: 5,
    minAttendanceThresholdPercent: 75,
    monthlyTuitionFee: 2500,
    registrationFee: 500,
    academicYear: "2025-2026",
  });
  console.log("✅ System Settings Seeded");

  // 2. Batches
  await Batch.deleteMany({});
  const batch1 = await Batch.create({
    name: "6:00 PM – 7:00 PM",
    startTime: "18:00",
    endTime: "19:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    gracePeriodMinutes: 5,
    isActive: true,
  });

  const batch2 = await Batch.create({
    name: "7:00 PM – 8:00 PM",
    startTime: "19:00",
    endTime: "20:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    gracePeriodMinutes: 5,
    isActive: true,
  });

  const batch3 = await Batch.create({
    name: "8:00 PM – 9:00 PM",
    startTime: "20:00",
    endTime: "21:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    capacity: 30,
    gracePeriodMinutes: 5,
    isActive: true,
  });
  console.log("✅ Batches Seeded");

  // 3. Subjects
  await Subject.deleteMany({});
  const subjects = await Subject.insertMany([
    { name: "Mathematics", code: "MATH", icon: "Calculator", color: "#6366f1" },
    { name: "Science", code: "SCI", icon: "Atom", color: "#10b981" },
    { name: "English", code: "ENG", icon: "BookOpen", color: "#f59e0b" },
    { name: "Social Science", code: "SOC", icon: "Globe", color: "#ec4899" },
    { name: "Tamil", code: "TAM", icon: "Languages", color: "#8b5cf6" },
  ]);
  console.log("✅ Subjects Seeded");

  // Clear Users & Profiles
  await User.deleteMany({});
  await StudentProfile.deleteMany({});
  await TeacherProfile.deleteMany({});

  // 4. Admin User
  const adminHash = await hashPassword("Admin@123");
  const adminUser = await User.create({
    name: "Acuity Administrator",
    email: "admin@acuity.edu",
    phone: "9876543210",
    passwordHash: adminHash,
    role: "ADMIN",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  });
  console.log("✅ Admin User Seeded (admin@acuity.edu / Admin@123)");

  // 5. Teachers
  const teacherHash = await hashPassword("Teacher@123");

  const teacherSarah = await User.create({
    name: "Dr. Sarah Jenkins",
    email: "sarah.maths@acuity.edu",
    phone: "9876543213",
    passwordHash: teacherHash,
    role: "TEACHER",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  });

  await TeacherProfile.create({
    userId: teacherSarah._id,
    qualification: "M.Sc. Mathematics, Ph.D, B.Ed",
    specialization: "Class 8-10 CBSE & ICSE Mathematics",
    subjects: ["Mathematics"],
    classesTaught: ["Class 8", "Class 9", "Class 10"],
    experienceYears: 8,
    approvalStatus: "ACTIVE",
    preferredBatchIds: [batch1._id, batch2._id],
  });

  const teacherRajesh = await User.create({
    name: "Prof. Rajesh Kumar",
    email: "rajesh.science@acuity.edu",
    phone: "9876543214",
    passwordHash: teacherHash,
    role: "TEACHER",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  });

  await TeacherProfile.create({
    userId: teacherRajesh._id,
    qualification: "M.Sc. Physics, M.Ed",
    specialization: "Experimental Physics & Chemistry for High School",
    subjects: ["Science", "Physics", "Chemistry"],
    classesTaught: ["Class 7", "Class 8", "Class 9", "Class 10"],
    experienceYears: 10,
    approvalStatus: "ACTIVE",
    preferredBatchIds: [batch2._id, batch3._id],
  });

  const teacherAnita = await User.create({
    name: "Ms. Anita Desai",
    email: "anita.english@acuity.edu",
    phone: "9876543215",
    passwordHash: teacherHash,
    role: "TEACHER",
    status: "PENDING_APPROVAL", // Pending for Admin Approval testing
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  });

  await TeacherProfile.create({
    userId: teacherAnita._id,
    qualification: "M.A. English Literature",
    specialization: "Creative Writing and Grammar",
    subjects: ["English"],
    classesTaught: ["Class 5", "Class 6", "Class 7", "Class 8"],
    experienceYears: 4,
    approvalStatus: "PENDING_APPROVAL",
    resumeUrl: "https://acuity.edu/docs/sample-resume.pdf",
    certificateUrl: "https://acuity.edu/docs/sample-degree.pdf",
    idProofUrl: "https://acuity.edu/docs/sample-id.pdf",
  });
  console.log("✅ Teachers Seeded (Approved & Pending Approval)");

  // 6. Students
  const studentHash = await hashPassword("Student@123");

  const studentAravind = await User.create({
    name: "Aravind Swaminathan",
    email: "aravind.class10@acuity.edu",
    phone: "9876543220",
    passwordHash: studentHash,
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  });

  await StudentProfile.create({
    userId: studentAravind._id,
    schoolName: "DAV Senior Secondary School",
    board: "CBSE",
    currentClass: "Class 10",
    subjects: ["Mathematics", "Science", "English", "Social Science"],
    batchId: batch2._id, // 7:00 PM – 8:00 PM
    parentName: "Swaminathan Raman",
    parentPhone: "9876543290",
    altEmergencyPhone: "9876543291",
    streakCount: 7,
    attendanceRiskLevel: "LOW",
    earnedBadges: ["First Class", "7-Day Streak 🔥", "Assignment Champion", "Quiz Ace"],
  });

  const studentPriya = await User.create({
    name: "Priya Sharma",
    email: "priya.class9@acuity.edu",
    phone: "9876543221",
    passwordHash: studentHash,
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  });

  await StudentProfile.create({
    userId: studentPriya._id,
    schoolName: "St. John's Matriculation Higher Sec School",
    board: "State Board",
    currentClass: "Class 9",
    subjects: ["Mathematics", "Science", "English", "Tamil"],
    batchId: batch1._id, // 6:00 PM – 7:00 PM
    parentName: "Ramesh Sharma",
    parentPhone: "9876543292",
    streakCount: 4,
    attendanceRiskLevel: "LOW",
    earnedBadges: ["First Class", "Perfect Week", "Math Wizard"],
  });

  const studentRohit = await User.create({
    name: "Rohit Verma",
    email: "rohit.class8@acuity.edu",
    phone: "9876543222",
    passwordHash: studentHash,
    role: "STUDENT",
    status: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  });

  await StudentProfile.create({
    userId: studentRohit._id,
    schoolName: "Kendriya Vidyalaya",
    board: "CBSE",
    currentClass: "Class 8",
    subjects: ["Mathematics", "Science"],
    batchId: batch2._id, // 7:00 PM – 8:00 PM
    parentName: "Vijay Verma",
    parentPhone: "9876543293",
    streakCount: 2,
    attendanceRiskLevel: "MEDIUM",
    earnedBadges: ["First Class", "Eager Learner"],
  });

  console.log("✅ Students Seeded");

  // 7. Live Sessions
  await LiveSession.deleteMany({});
  const todayStr = new Date().toISOString().split("T")[0];

  const session1 = await LiveSession.create({
    title: "Class 10 CBSE — Quadratic Equations Masterclass",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: batch2._id, // 7:00 PM – 8:00 PM
    teacherId: teacherSarah._id,
    topic: "Roots of Quadratic Equations & Word Problems",
    description: "Discriminant Formula & Solving Complex Word Problems from NCERT.",
    date: todayStr,
    startTime: "19:00",
    endTime: "20:00",
    status: "LIVE",
    meetingId: "ACUITY-MATH-QUADRATICS-101",
    livekitRoomId: "ACUITY-MATH-QUADRATICS-101",
    gracePeriodMinutes: 5,
    attendanceThresholdPercent: 75,
    materials: [
      { title: "Quadratic Formula Sheet", fileUrl: "https://acuity.edu/materials/quad-formula.pdf", category: "NOTES" },
    ],
  });

  const session2 = await LiveSession.create({
    title: "Class 9 — Laws of Motion & Momentum Lab",
    subject: "Science",
    classLevel: "Class 9",
    batchId: batch1._id,
    teacherId: teacherRajesh._id,
    topic: "Newton's 2nd Law (F = ma) & Numerical Problems",
    description: "Derivations and problem set on conservation of momentum.",
    date: todayStr,
    startTime: "18:00",
    endTime: "19:00",
    status: "COMPLETED",
    meetingId: "ACUITY-SCI-NEWTON-901",
    livekitRoomId: "ACUITY-SCI-NEWTON-901",
    gracePeriodMinutes: 5,
    attendanceThresholdPercent: 75,
  });

  const session3 = await LiveSession.create({
    title: "Class 10 CBSE — Applications of Trigonometry (Heights & Distances)",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: batch2._id,
    teacherId: teacherSarah._id,
    topic: "Heights & Distances — Angle of Elevation & Depression Solved Exemplars",
    description: "NCERT & State Board exam-oriented problem sets with step-by-step diagram methods.",
    date: todayStr,
    startTime: "19:00",
    endTime: "20:00",
    status: "PUBLISHED",
    meetingId: "ACUITY-MATH-TRIGONOMETRY-102",
    livekitRoomId: "ACUITY-MATH-TRIGONOMETRY-102",
    gracePeriodMinutes: 5,
    attendanceThresholdPercent: 75,
    materials: [
      { title: "Class 10 Trigonometry Formula Sheet", fileUrl: "https://acuity.edu/materials/trig-formulas.pdf", category: "NOTES" },
    ],
  });
  console.log("✅ Live Sessions Seeded");

  // 8. Learning Hub Materials
  await Material.deleteMany({});
  await Material.insertMany([
    {
      title: "Class 10 Mathematics — Formulas & Theorems Complete Pack",
      description: "Quick revision formula handbook covering Quadratic Equations, Arithmetic Progressions, and Trigonometry.",
      category: "NOTES",
      fileUrl: "https://acuity.edu/materials/class10-maths-formulas.pdf",
      fileName: "Class10_Maths_Formulas.pdf",
      fileSize: "2.4 MB",
      classLevel: "Class 10",
      subject: "Mathematics",
      batchId: batch2._id,
      uploadedBy: teacherSarah._id,
    },
    {
      title: "Class 10 Science — Light: Reflection & Refraction Ray Diagrams",
      description: "Step-by-step ray diagram guide with solved NCERT exemplar questions.",
      category: "WORKSHEET",
      fileUrl: "https://acuity.edu/materials/class10-science-light.pdf",
      fileName: "Light_Ray_Diagrams_Exemplar.pdf",
      fileSize: "3.8 MB",
      classLevel: "Class 10",
      subject: "Science",
      batchId: batch2._id,
      uploadedBy: teacherRajesh._id,
    },
    {
      title: "Class 9 Science — Laws of Motion Solved Question Paper",
      description: "Board model test paper with step marking criteria.",
      category: "QUESTION_PAPER",
      fileUrl: "https://acuity.edu/materials/class9-science-laws-of-motion.pdf",
      fileName: "Class9_Science_Model_Paper.pdf",
      fileSize: "1.9 MB",
      classLevel: "Class 9",
      subject: "Science",
      batchId: batch1._id,
      uploadedBy: teacherRajesh._id,
    },
  ]);
  console.log("✅ Learning Materials Seeded");

  // 9. Assignments
  await Assignment.deleteMany({});
  await AssignmentSubmission.deleteMany({});

  const assign1 = await Assignment.create({
    title: "Quadratic Equations — Practice Worksheet 4",
    description: "Solve all 10 word problems regarding speed/distance and work-done. Show full working steps.",
    subject: "Mathematics",
    classLevel: "Class 10",
    batchId: batch2._id,
    teacherId: teacherSarah._id,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    maxMarks: 20,
    attachmentUrl: "https://acuity.edu/assignments/quad-worksheet-4.pdf",
  });

  await AssignmentSubmission.create({
    assignmentId: assign1._id,
    studentId: studentAravind._id,
    submissionText: "Completed all 10 problems with verified quadratic roots.",
    fileUrl: "https://acuity.edu/submissions/aravind_quad_solutions.pdf",
    submittedAt: new Date(),
    status: "EVALUATED",
    marksObtained: 19,
    feedback: "Excellent solution presentation! Double-check unit conversions in question 7.",
    gradedBy: teacherSarah._id,
    gradedAt: new Date(),
  });
  console.log("✅ Assignments & Submissions Seeded");

  // 10. Attendance Records
  await Attendance.deleteMany({});
  await Attendance.insertMany([
    {
      studentId: studentAravind._id,
      sessionId: session1._id,
      batchId: batch2._id,
      classLevel: "Class 10",
      joinTime: new Date(Date.now() - 55 * 60 * 1000),
      leaveTime: new Date(),
      durationMinutes: 55,
      totalDurationMinutes: 55,
      status: "PRESENT",
      sessions: [
        {
          joinTime: new Date(Date.now() - 55 * 60 * 1000),
          leaveTime: new Date(),
          durationMinutes: 55,
        },
      ],
      manualOverride: false,
    },
    {
      studentId: studentPriya._id,
      sessionId: session2._id,
      batchId: batch1._id,
      classLevel: "Class 9",
      joinTime: new Date(Date.now() - 60 * 60 * 1000),
      leaveTime: new Date(Date.now() - 45 * 60 * 1000),
      durationMinutes: 15,
      totalDurationMinutes: 15,
      status: "ABSENT",
      sessions: [
        {
          joinTime: new Date(Date.now() - 60 * 60 * 1000),
          leaveTime: new Date(Date.now() - 45 * 60 * 1000),
          durationMinutes: 15,
        },
      ],
      manualOverride: false,
    },
    {
      studentId: studentRohit._id,
      sessionId: session1._id,
      batchId: batch2._id,
      classLevel: "Class 8",
      joinTime: new Date(Date.now() - 50 * 60 * 1000),
      leaveTime: new Date(),
      durationMinutes: 48,
      totalDurationMinutes: 48,
      status: "PRESENT",
      sessions: [
        {
          joinTime: new Date(Date.now() - 50 * 60 * 1000),
          leaveTime: new Date(Date.now() - 30 * 60 * 1000),
          durationMinutes: 20,
        },
        {
          joinTime: new Date(Date.now() - 28 * 60 * 1000),
          leaveTime: new Date(),
          durationMinutes: 28,
        },
      ],
      manualOverride: false,
    },
  ]);

  // 11. Payments
  await Payment.deleteMany({});
  const currentMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthStr = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(prevMonthDate);

  const prevPaidDate = new Date();
  prevPaidDate.setDate(prevPaidDate.getDate() - 20);

  await Payment.insertMany([
    {
      studentId: studentAravind._id,
      amount: 2500,
      billingMonth: prevMonthStr,
      courseName: `Class 10 CBSE — Mathematics & Science (${prevMonthStr})`,
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      paidDate: prevPaidDate,
      status: "PAID",
      receiptNumber: `REC-${prevMonthDate.getFullYear()}-00189`,
      paymentMethod: "Online UPI (Razorpay)",
      transactionId: "pay_Rzp10982348",
    },
    {
      studentId: studentAravind._id,
      amount: 2500,
      billingMonth: currentMonthStr,
      courseName: `Class 10 CBSE — All Subjects Comprehensive Bundle (${currentMonthStr})`,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      receiptNumber: `REC-${new Date().getFullYear()}-00244`,
    },
  ]);

  // 12. Staff Attendance
  await StaffAttendance.deleteMany({});
  await StaffAttendance.create({
    teacherId: teacherSarah._id,
    date: todayStr,
    loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    classesConducted: 2,
    workingHours: 4,
    status: "PRESENT",
  });

  // 13. Notifications
  await Notification.deleteMany({});
  await Notification.insertMany([
    {
      userId: studentAravind._id,
      title: "Live Class Starting Soon: Mathematics",
      message: "Quadratic Equations Masterclass starts in batch 7:00 PM – 8:00 PM. Have your notebooks ready!",
      type: "CLASS_REMINDER",
      read: false,
      linkUrl: "/student/classes",
    },
    {
      userId: studentAravind._id,
      title: "Assignment Graded (19/20)",
      message: "Dr. Sarah evaluated your Quadratic Equations practice worksheet.",
      type: "ASSIGNMENT",
      read: true,
      linkUrl: "/student/assignments",
    },
  ]);

  console.log("🌟 Acuity Tutoring Database Seeding Completed Successfully!");
  return { success: true };
}

if (require.main === module || process.argv[1]?.includes("seed")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
