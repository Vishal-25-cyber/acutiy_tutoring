"use client";

import React, { use } from "react";
import { ClassroomRoom } from "@/components/classroom/ClassroomRoom";

export default function StudentClassroomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);

  return (
    <ClassroomRoom
      sessionId={resolvedParams.sessionId}
      currentUserRole="STUDENT"
      currentUserName="Aravind Swaminathan"
      currentUserId="st-student-aravind"
    />
  );
}
