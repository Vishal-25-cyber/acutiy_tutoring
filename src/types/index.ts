export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export type AccountStatus = "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED";

export type AttendanceStatus = "PRESENT" | "LATE" | "PARTIAL" | "ABSENT";

export type PaymentStatus = "PAID" | "PENDING" | "PENDING_VERIFICATION" | "OVERDUE" | "FAILED";

export type SubmissionStatus = "PENDING" | "SUBMITTED" | "EVALUATED" | "OVERDUE";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ClassLevel =
  | "Class 1"
  | "Class 2"
  | "Class 3"
  | "Class 4"
  | "Class 5"
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10";

export type EducationBoard = "CBSE" | "State Board";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentProfile {
  _id: string;
  userId: string | IUser;
  schoolName: string;
  board: EducationBoard;
  currentClass: ClassLevel;
  subjects: string[];
  batchId: string | IBatch;
  parentName: string;
  parentPhone: string;
  altEmergencyPhone?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  streakCount: number;
  streakLastUpdated?: Date;
  earnedBadges: string[];
  attendanceRiskLevel: RiskLevel;
  totalClassesAttended: number;
  totalClassesScheduled: number;
}

export interface ITeacherProfile {
  _id: string;
  userId: string | IUser;
  qualification: string;
  specialization: string;
  subjects: string[];
  classesTaught: ClassLevel[];
  experienceYears: number;
  address?: string;
  resumeUrl?: string;
  certificateUrl?: string;
  idProofUrl?: string;
  approvalStatus: AccountStatus;
  preferredBatchIds?: (string | IBatch)[];
}

export interface IBatch {
  _id: string;
  name: string; // e.g. "6:00 PM – 7:00 PM"
  startTime: string; // "18:00"
  endTime: string; // "19:00"
  days: string[]; // ["Monday", "Tuesday", "Wednesday", ...]
  capacity: number;
  gracePeriodMinutes: number; // default: 5
  assignedTeacherIds?: (string | IUser)[];
  isActive: boolean;
  createdAt: Date;
}

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  icon?: string;
  color?: string;
}

export type ClassStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface IClassMaterial {
  title: string;
  fileUrl: string;
  category?: string;
  fileSize?: string;
}

export interface IAttendanceSession {
  joinTime: Date | string;
  leaveTime?: Date | string;
  durationMinutes: number;
}

export interface ILiveSession {
  _id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  batchId: string | IBatch;
  teacherId: string | IUser;
  topic: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "19:00"
  endTime: string; // "20:00"
  status: ClassStatus;
  meetingId: string;
  livekitRoomId?: string;
  gracePeriodMinutes: number;
  attendanceThresholdPercent?: number;
  materials?: IClassMaterial[];
  actualStartTime?: Date;
  actualEndTime?: Date;
  allowLateJoinManually?: boolean;
  recordingUrl?: string;
  activePoll?: IClassroomPoll;
  pendingAdmissions?: Array<{ userId: string; name: string; requestedAt: Date }>;
  admittedStudents?:  Array<{ userId: string; admittedAt: Date }>;
  deniedStudents?:    Array<{ userId: string }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendance {
  _id: string;
  studentId: string | IUser;
  sessionId: string | ILiveSession;
  batchId: string | IBatch;
  classLevel: ClassLevel;
  sessions?: IAttendanceSession[];
  totalDurationMinutes?: number;
  joinTime?: Date;
  leaveTime?: Date;
  durationMinutes: number;
  status: AttendanceStatus;
  manualOverride: boolean;
  remarks?: string;
  lastActiveTime?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IStaffAttendance {
  _id: string;
  teacherId: string | IUser;
  date: string; // YYYY-MM-DD
  loginTime: Date;
  logoutTime?: Date;
  classesConducted: number;
  workingHours: number;
  status: "PRESENT" | "LEAVE" | "HALF_DAY" | "ABSENT";
}

export interface IMaterial {
  _id: string;
  title: string;
  description?: string;
  category: "NOTES" | "PDF" | "WORKSHEET" | "ASSIGNMENT" | "QUESTION_PAPER" | "REVISION" | "RECORDING";
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  classLevel: ClassLevel;
  subject: string;
  batchId?: string | IBatch;
  uploadedBy: string | IUser;
  createdAt: Date;
}

export interface IAssignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  classLevel: ClassLevel;
  batchId: string | IBatch;
  teacherId: string | IUser;
  dueDate: Date;
  maxMarks: number;
  attachmentUrl?: string;
  createdAt: Date;
}

export interface IAssignmentSubmission {
  _id: string;
  assignmentId: string | IAssignment;
  studentId: string | IUser;
  submissionText?: string;
  fileUrl?: string;
  submittedAt: Date;
  status: SubmissionStatus;
  marksObtained?: number;
  feedback?: string;
  gradedBy?: string | IUser;
  gradedAt?: Date;
}

export interface IPayment {
  _id: string;
  studentId: string | IUser;
  amount: number;
  billingMonth: string; // "January 2025"
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  receiptNumber: string;
  paymentMethod?: string;
  transactionId?: string;
  courseName?: string;
  courseId?: string;
  upiId?: string;
}

export interface INotification {
  _id: string;
  userId: string | IUser | any;
  title: string;
  message: string;
  type: "CLASS_REMINDER" | "NEW_MATERIAL" | "ASSIGNMENT" | "ATTENDANCE_WARNING" | "ANNOUNCEMENT" | "SYSTEM";
  read: boolean;
  linkUrl?: string;
  createdAt: Date;
}

export interface ISystemSettings {
  companyName: string;
  logoUrl?: string;
  upiId?: string;
  qrCodeImageUrl?: string;
  supportPhone1: string;
  supportPhone2: string;
  supportPhone3: string;
  supportEmail: string;
  defaultGracePeriodMinutes: number;
  minAttendanceThresholdPercent: number;
  monthlyTuitionFee: number;
  registrationFee: number;
  academicYear: string;
}

export interface IAuditLog {
  _id: string;
  actorId: string | IUser;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

export interface IClassroomPoll {
  question: string;
  options: { text: string; votes: number }[];
  isActive: boolean;
  votedUserIds: string[];
}
