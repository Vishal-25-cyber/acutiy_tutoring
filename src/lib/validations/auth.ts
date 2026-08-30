import { z } from "zod";
import {
  phone10DigitSchema,
  optionalPhone10DigitSchema,
  emailDomainSchema,
} from "./phone";

export const studentLoginSchema = z.object({
  identifier: z.string().min(3, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  batchId: z.string().min(1, "Please select your assigned batch"),
});

export const teacherLoginSchema = z.object({
  email: emailDomainSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminLoginSchema = z.object({
  email: emailDomainSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentRegisterSchema = z.object({
  // Personal
  name: z.string().min(2, "Full name is required"),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("OTHER"),
  phone: phone10DigitSchema,
  altPhone: optionalPhone10DigitSchema,
  email: emailDomainSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  // Academic
  schoolName: z.string().min(2, "School name is required"),
  board: z.enum(["CBSE", "Matriculation", "ICSE", "State Board", "Other"]),
  currentClass: z.enum([
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
  ]),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  // Batch
  batchId: z.string().min(1, "Please select your preferred batch"),
  // Emergency
  parentName: z.string().min(2, "Parent/Guardian name is required"),
  parentPhone: phone10DigitSchema,
  altEmergencyPhone: optionalPhone10DigitSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const teacherRegisterSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: phone10DigitSchema,
  altPhone: optionalPhone10DigitSchema,
  email: emailDomainSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  address: z.string().optional(),
  qualification: z.string().min(2, "Highest qualification is required"),
  specialization: z.string().min(2, "Specialization / Major is required"),
  subjects: z.array(z.string()).min(1, "Select at least one subject to teach"),
  classesTaught: z.array(z.string()).min(1, "Select at least one class level"),
  experienceYears: z.coerce.number().min(0, "Experience years is required"),
  resumeUrl: z.string().optional(),
  certificateUrl: z.string().optional(),
  idProofUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const liveClassCreateSchema = z.object({
  title: z.string().min(3, "Class title is required"),
  subject: z.string().min(2, "Subject is required"),
  classLevel: z.enum([
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
  ]),
  batchId: z.string().min(1, "Batch is required"),
  topic: z.string().min(3, "Topic is required"),
  date: z.string().min(10, "Date is required"),
  startTime: z.string().min(4, "Start time is required"),
  endTime: z.string().min(4, "End time is required"),
  gracePeriodMinutes: z.coerce.number().default(5),
});

export const batchCreateSchema = z.object({
  name: z.string().min(3, "Batch name is required (e.g. 7:00 PM – 8:00 PM)"),
  startTime: z.string().min(4, "Start time is required"),
  endTime: z.string().min(4, "End time is required"),
  days: z.array(z.string()).min(1, "Select at least one active day"),
  capacity: z.coerce.number().min(1).default(30),
  gracePeriodMinutes: z.coerce.number().min(0).default(5),
});
