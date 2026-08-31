"use client";

import React from "react";
import { useParams } from "next/navigation";
import { JitsiClassroom } from "@/components/classroom/JitsiClassroom";

export default function StudentClassroomPage() {
  const params = useParams();
  const sessionId = (params?.sessionId as string) || "acuity-session";

  return <JitsiClassroom classId={sessionId} currentUserRole="STUDENT" />;
}
