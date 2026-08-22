"use client";

import React, { use } from "react";
import { ClassroomRoom } from "@/components/classroom/ClassroomRoom";

export default function TeacherClassroomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);

  return (
    <ClassroomRoom
      sessionId={resolvedParams.sessionId}
      currentUserRole="TEACHER"
      currentUserName="Dr. Sarah Jenkins"
      currentUserId="teacher-sarah-jenkins"
    />
  );
}
