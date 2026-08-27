"use client";

import React from "react";
import { useParams } from "react-router-dom";
import { JitsiClassroom } from "@/components/classroom/JitsiClassroom";

export default function ClassroomPage(props?: { params?: Promise<{ classId: string }> | { classId: string } }) {
  const routerParams = useParams<{ classId: string }>();
  const classId = routerParams?.classId || "acuity-live-classroom";

  return <JitsiClassroom classId={classId} />;
}
