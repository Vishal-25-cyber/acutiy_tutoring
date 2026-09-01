import mongoose from "mongoose";

// Import all models to ensure schemas are registered in Mongoose
import "@/models/User";
import "@/models/StudentProfile";
import "@/models/TeacherProfile";
import "@/models/Batch";
import "@/models/Subject";
import "@/models/LiveSession";
import "@/models/Attendance";
import "@/models/StaffAttendance";
import "@/models/Assignment";
import "@/models/AssignmentSubmission";
import "@/models/Material";
import "@/models/Notification";
import "@/models/Test";
import "@/models/TestResult";
import "@/models/TeacherRemark";
import "@/models/ParentCommunication";
import "@/models/StudentReportHistory";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acuity_tutoring";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        console.warn("MongoDB connection warning / fallback:", err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
