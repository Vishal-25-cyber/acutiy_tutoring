"use client";

import React from "react";
import { useParams } from "next/navigation";
import { JitsiClassroom } from "@/components/classroom/JitsiClassroom";

export default function ClassroomPage() {
  const routerParams = useParams();
  const classId = (routerParams?.classId as string) || "acuity-live-classroom";

  return <JitsiClassroom classId={classId} />;
}
