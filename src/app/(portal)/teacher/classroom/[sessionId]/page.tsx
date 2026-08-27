"use client";

import React, { use } from "react";
import { JitsiClassroom } from "@/components/classroom/JitsiClassroom";

export default function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = use(params);

  return <JitsiClassroom classId={resolvedParams.sessionId} currentUserRole="TEACHER" />;
}
