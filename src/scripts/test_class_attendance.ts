import dotenv from "dotenv";
dotenv.config();

import connectToDatabase from "@/lib/db/mongoose";
import User from "@/models/User";
import LiveSession from "@/models/LiveSession";
import { GET as getClassAttendance } from "@/app/api/classes/[id]/attendance/route";
import { signToken } from "@/lib/auth/jwt";
import { requestContextStorage } from "@/lib/auth/session-storage";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

async function test() {
  await connectToDatabase();

  const sarah = await User.findOne({ email: "sarah.maths@acuity.edu" });
  if (!sarah) return;
  const session = await LiveSession.findOne({ teacherId: sarah._id });
  if (!session) return;
  console.log("Found session for Sarah:", session._id, session.title);

  const token = await signToken({
    userId: sarah._id.toString(),
    email: sarah.email,
    role: sarah.role,
    name: sarah.name,
    status: sarah.status,
  });

  await requestContextStorage.run(
    { cookies: { [AUTH_COOKIE_NAME]: token }, headers: new Headers() },
    async () => {
      const mockReq: any = {
        url: `http://localhost:3000/api/classes/${session._id}/attendance`,
        headers: new Headers(),
      };

      const res = await getClassAttendance(mockReq, { params: { id: session._id.toString() } } as any);
      console.log("Status:", res.status);
      const data = await res.json();
      console.log("Class Attendance Response:", JSON.stringify(data, null, 2));
    }
  );

  process.exit(0);
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
