"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?mode=contact");
  }, [router]);

  return null;
}
