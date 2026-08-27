"use client";

import React, { use } from "react";
import { JitsiClassroom } from "@/components/classroom/JitsiClassroom";

export default function ClassroomPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const resolvedParams = use(params);

  return <JitsiClassroom classId={resolvedParams.classId} />;
}
