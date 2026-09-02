"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video, VideoOff, Mic, MicOff, Users, Clock, PhoneOff,
  AlertCircle, Info, Hand, MonitorUp, MessageSquare, Send,
  Volume2, X, Loader2, CheckCircle2, XCircle, Bell, Smile,
} from "lucide-react";

/* ─────────────────────────────────────────────── */
/*  Types                                          */
/* ─────────────────────────────────────────────── */
interface JitsiClassroomProps {
  classId: string;
  currentUserRole?: "STUDENT" | "TEACHER" | "ADMIN";
  currentUserName?: string;
  currentUserId?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

interface PendingStudent {
  userId: string;
  name: string;
  requestedAt: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number;
}

type Stage =
  | "LOADING"
  | "WAITING_ROOM"       // student: camera preview + "Ask to join"
  | "PENDING_ADMISSION"  // student: waiting for teacher to admit
  | "DENIED"             // student: teacher rejected
  | "LIVE_CLASS"
  | "ENDED"              // faculty concluded class
  | "ERROR";

/* ─────────────────────────────────────────────── */
/*  Main Component                                 */
/* ─────────────────────────────────────────────── */
export function JitsiClassroom({
  classId,
  currentUserRole = "STUDENT",
  currentUserName = "User",
  currentUserId = "",
}: JitsiClassroomProps) {
  const router = useRouter();

  /* ── Core State ── */
  const [stage, setStage] = useState<Stage>("LOADING");
  const [errorMessage, setErrorMessage] = useState("");
  const [classData, setClassData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{
    id: string; name: string; email?: string; role: string; isTeacher: boolean;
  }>({
    id: currentUserId,
    name: currentUserName,
    role: currentUserRole,
    isTeacher: currentUserRole === "TEACHER" || currentUserRole === "ADMIN",
  });
  const userInfoRef = useRef(userInfo);
  useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);

  const classDataRef = useRef(classData);
  useEffect(() => { classDataRef.current = classData; }, [classData]);

  /* ── Live Floating Reactions ── */
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showReactionsPicker, setShowReactionsPicker] = useState(false);

  /* ── A/V Controls ── */
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  /* ── Sidebar ── */
  const [activeSidebar, setActiveSidebar] = useState<"NONE" | "CHAT" | "PEOPLE" | "INFO">("NONE");

  /* ── Duration timer ── */
  const [durationSeconds, setDurationSeconds] = useState(0);

  /* ── Chat ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  /* ── Teacher: pending knock list ── */
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [admittedList, setAdmittedList] = useState<{ userId: string; name?: string }[]>([]);
  const [admittingId, setAdmittingId] = useState<string | null>(null);

  /* ── Refs ── */
  const localVideoRef      = useRef<HTMLVideoElement | null>(null);
  const teacherVideoRef    = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef     = useRef<HTMLVideoElement | null>(null);
  const prejoinVideoRef    = useRef<HTMLVideoElement | null>(null);
  const localStreamRef     = useRef<MediaStream | null>(null);
  const remoteStreamRef    = useRef<MediaStream | null>(null);
  const peerConnectionRef  = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef    = useRef<MediaStream | null>(null);
  const chatBottomRef      = useRef<HTMLDivElement | null>(null);
  const pollTimerRef       = useRef<NodeJS.Timeout | null>(null);
  const queuedIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const lastSignalSeqRef   = useRef<number>(0);
  const lastOfferTimeRef   = useRef<number>(0);

  const isMicOnRef = useRef(isMicOn);
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);
  const isCameraOnRef = useRef(isCameraOn);
  useEffect(() => { isCameraOnRef.current = isCameraOn; }, [isCameraOn]);
  const isScreenSharingRef = useRef(isScreenSharing);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);

  /* ── WebRTC & Realtime State ── */
  const [remoteParticipant, setRemoteParticipant] = useState<{ id: string; name: string; role: string; isCameraOn?: boolean; isMicOn?: boolean } | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [realtimeParticipants, setRealtimeParticipants] = useState<{ id: string; name: string; role: string; isCameraOn?: boolean; isMicOn?: boolean }[]>([]);

  const stopAllMedia = useCallback(() => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
        screenStreamRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping media tracks:", e);
    }
  }, []);

  /* ─────────────────────────────────────────────────
     1.  Load class data on mount
  ───────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/classes/${classId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to join class session.");
        if (!mounted) return;

        setClassData(data.class);
        const resolvedUser = data.user || {};
        setUserInfo({
          id: resolvedUser.id || currentUserId,
          name: resolvedUser.name || currentUserName,
          email: resolvedUser.email,
          role: resolvedUser.role || currentUserRole,
          isTeacher: Boolean(resolvedUser.isTeacher),
        });

        if (resolvedUser.role === "TEACHER" || resolvedUser.role === "ADMIN" || data.isAdmitted) {
          // Teacher or already admitted student enters immediately and activates camera
          setIsCameraOn(true);
          setIsMicOn(true);
          setStage("LIVE_CLASS");
          recordAttendanceJoin(data.class?.id || classId);
        } else {
          // Student goes to waiting room first with camera off until clicking Ask to Join
          setIsCameraOn(false);
          setStage("WAITING_ROOM");
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMessage(err.message || "Could not connect to classroom.");
          setStage("ERROR");
        }
      }
    }
    load();
    return () => {
      mounted = false;
      stopAllMedia();
    };
  }, [classId]);

  /* ─────────────────────────────────────────────────
     Stop all media tracks completely & release hardware
  ───────────────────────────────────────────────── */
  const stopAllMediaTracks = useCallback(() => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Track stop error:", e);
          }
        });
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn("Screen track stop error:", e);
          }
        });
        screenStreamRef.current = null;
      }
      if (prejoinVideoRef.current) prejoinVideoRef.current.srcObject = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (teacherVideoRef.current) teacherVideoRef.current.srcObject = null;
    } catch (err) {
      console.warn("stopAllMediaTracks error:", err);
    }
  }, []);

  // Global unmount & window pageleave cleanup (ensures webcam hardware light turns off immediately)
  useEffect(() => {
    const handleLeaveWindow = () => {
      stopAllMediaTracks();
    };
    window.addEventListener("beforeunload", handleLeaveWindow);
    window.addEventListener("pagehide", handleLeaveWindow);

    return () => {
      window.removeEventListener("beforeunload", handleLeaveWindow);
      window.removeEventListener("pagehide", handleLeaveWindow);
      stopAllMediaTracks();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [stopAllMediaTracks]);

  const jitsiApiRef = useRef<any>(null);

  /* ─────────────────────────────────────────────────
     2a.  Add Tracks / Pre-allocate Transceivers
  ───────────────────────────────────────────────── */
  const addTracksToPeerConnection = useCallback((pc: RTCPeerConnection) => {
    try {
      const stream = screenStreamRef.current || localStreamRef.current;
      if (!stream) {
        // Pre-create transceivers so initial SDP offer/answer allocates audio & video slots
        const senders = pc.getSenders();
        if (!senders.some((s) => s.track?.kind === "audio" || (s as any).kind === "audio")) {
          try { pc.addTransceiver("audio", { direction: "sendrecv" }); } catch (e) {}
        }
        if (!senders.some((s) => s.track?.kind === "video" || (s as any).kind === "video")) {
          try { pc.addTransceiver("video", { direction: "sendrecv" }); } catch (e) {}
        }
        return;
      }
      stream.getTracks().forEach((track) => {
        const senders = pc.getSenders();
        const existingSender = senders.find(
          (s) => s.track?.kind === track.kind || (s as any).kind === track.kind
        );
        if (existingSender) {
          existingSender.replaceTrack(track).catch(() => {});
        } else {
          try {
            pc.addTrack(track, stream);
          } catch (e) {
            const transceiver = pc.getTransceivers().find(
              (t) => t.receiver?.track?.kind === track.kind || t.sender?.track?.kind === track.kind
            );
            if (transceiver?.sender) {
              transceiver.sender.replaceTrack(track).catch(() => {});
            }
          }
        }
      });
    } catch (e) {
      console.warn("[WebRTC] addTracksToPeerConnection warning:", e);
    }
  }, []);

  /* ─────────────────────────────────────────────────
     2b.  Camera / Mic stream management
  ───────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    async function setupStream() {
      if (!isCameraOn) {
        // Stop video tracks to immediately turn off physical camera indicator LED
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
          const audioTracks = localStreamRef.current.getAudioTracks();
          localStreamRef.current = audioTracks.length > 0 ? new MediaStream(audioTracks) : null;
        }
        if (prejoinVideoRef.current) prejoinVideoRef.current.srcObject = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (teacherVideoRef.current) teacherVideoRef.current.srcObject = null;
        return;
      }

      try {
        if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          }
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          // Sync initial audio state
          stream.getAudioTracks().forEach((t) => (t.enabled = isMicOn));

          // Immediately pipe camera and mic tracks into active peer connection
          if (peerConnectionRef.current) {
            addTracksToPeerConnection(peerConnectionRef.current);
          }
        }

        const ref =
          stage === "WAITING_ROOM" || stage === "PENDING_ADMISSION"
            ? prejoinVideoRef.current
            : userInfoRef.current.isTeacher
            ? teacherVideoRef.current
            : localVideoRef.current;
        if (ref && localStreamRef.current) ref.srcObject = localStreamRef.current;
      } catch (err) {
        console.warn("Camera/mic unavailable:", err);
      }
    }

    if (stage !== "LOADING" && stage !== "ERROR" && stage !== "DENIED") {
      setupStream();
    } else {
      stopAllMediaTracks();
    }

    return () => {
      active = false;
    };
  }, [isCameraOn, stage, userInfo.isTeacher, stopAllMediaTracks, addTracksToPeerConnection]);

  // Sync audio track with mic toggle
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = isMicOn;
    });
  }, [isMicOn]);

  // Attach local and remote streams when stage transitions or updates
  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;
    const localRef = userInfo.isTeacher ? teacherVideoRef.current : localVideoRef.current;
    if (localRef && localStreamRef.current) localRef.srcObject = localStreamRef.current;
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [stage, userInfo.isTeacher, hasRemoteVideo, remoteParticipant?.id, admittedList.length]);

  const hasRemoteVideoRef = useRef(hasRemoteVideo);
  useEffect(() => { hasRemoteVideoRef.current = hasRemoteVideo; }, [hasRemoteVideo]);
  const admittedListRef = useRef(admittedList);
  useEffect(() => { admittedListRef.current = admittedList; }, [admittedList]);

  // Release camera/mic when entering live class so Jitsi Meet gets direct hardware access
  useEffect(() => {
    if (stage === "LIVE_CLASS") {
      stopAllMediaTracks();
    }
  }, [stage, stopAllMediaTracks]);

  const handleLeaveClass = useCallback(async () => {
    stopAllMediaTracks();
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (e) {}
      jitsiApiRef.current = null;
    }
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    stopAllMedia();
    const targetClassId = classDataRef.current?.id || classDataRef.current?.livekitRoomId || classId;

    if (userInfoRef.current.isTeacher) {
      try {
        await fetch(`/api/classes/${targetClassId}/end`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn("Failed to mark class as ended:", e);
      }
      router.push("/teacher/dashboard");
    } else {
      try {
        await fetch(`/api/classes/${targetClassId}/admit`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {}

      try {
        await fetch("/api/attendance/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: targetClassId,
            durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
          }),
        });
      } catch (e) { console.warn(e); }

      router.push("/student/classes");
    }
  }, [stopAllMediaTracks, stopAllMedia, classId, router, durationSeconds]);

  /* ─────────────────────────────────────────────────
     2c.  Jitsi Meet Video Conferencing Integration
  ───────────────────────────────────────────────── */
  const [jitsiError, setJitsiError] = useState(false);

  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;

    stopAllMediaTracks();

    let disposed = false;

    const initJitsi = () => {
      if (disposed) return;
      const container = document.getElementById("jitsi-meet-container");
      if (!container) return;

      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }

      const safeRoomName = `AcuityTutoring_${classId.replace(/[^a-zA-Z0-9]/g, "")}`;

      if ((window as any).JitsiMeetExternalAPI) {
        try {
          const api = new (window as any).JitsiMeetExternalAPI("meet.jit.si", {
            roomName: safeRoomName,
            parentNode: container,
            width: "100%",
            height: "100%",
            userInfo: {
              displayName: (userInfoRef.current.name || userInfo.name || "Participant") + (userInfoRef.current.isTeacher ? " (Teacher)" : " (Student)"),
              email: userInfoRef.current.email || userInfo.email,
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              prejoinPageEnabled: false,
              prejoinConfig: { enabled: false },
              disableDeepLinking: true,
              enableWelcomePage: false,
              enableClosePage: false,
              hideConferenceSubject: false,
              subject: classData?.title || classData?.subject || "Live Classroom",
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
              DEFAULT_REMOTE_DISPLAY_NAME: "Student",
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "desktop",
                "chat",
                "raisehand",
                "reactions",
                "tileview",
                "videoquality",
                "fullscreen",
                "hangup",
              ],
            },
          });

          jitsiApiRef.current = api;

          api.addEventListener("videoConferenceLeft", () => {
            handleLeaveClass();
          });

          api.addEventListener("readyToClose", () => {
            handleLeaveClass();
          });
          return;
        } catch (err) {
          console.warn("Jitsi Meet API init error, activating fallback:", err);
          setJitsiError(true);
        }
      } else {
        setJitsiError(true);
      }
    };

    if (!(window as any).JitsiMeetExternalAPI) {
      const existingScript = document.getElementById("jitsi-external-api");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "jitsi-external-api";
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => {
          if (!disposed) initJitsi();
        };
        script.onerror = () => {
          if (!disposed) setJitsiError(true);
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (!disposed) initJitsi();
        });
      }
    } else {
      initJitsi();
    }

    return () => {
      disposed = true;
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [stage, classId, stopAllMediaTracks, handleLeaveClass, classData?.title, classData?.subject, userInfo.name, userInfo.email]);

  /* ─────────────────────────────────────────────────
     3a.  STUDENT → knock & poll for admission
  ───────────────────────────────────────────────── */
  const askToJoin = useCallback(async () => {
    setIsCameraOn(true);
    setStage("PENDING_ADMISSION");

    const targetClassId = classData?.id || classData?.livekitRoomId || classId;
    const token = typeof window !== "undefined" ? (localStorage.getItem("acuity_auth_token") || sessionStorage.getItem("acuity_auth_token")) : "";
    const studentName = userInfoRef.current.name || userInfo.name || "Student";
    const studentId = userInfoRef.current.id || userInfo.id || currentUserId;

    // Send knock
    try {
      await fetch(`/api/classes/${targetClassId}/admit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: studentName, userId: studentId }),
      });
    } catch (e) {
      console.warn("Knock failed:", e);
    }

    // Start polling every 700ms for instant admission
    const poll = async () => {
      try {
        const activeStudentId = userInfoRef.current.id || userInfo.id || currentUserId;
        const authTok = typeof window !== "undefined" ? (localStorage.getItem("acuity_auth_token") || sessionStorage.getItem("acuity_auth_token")) : "";
        const res = await fetch(
          `/api/classes/${targetClassId}/admit?userId=${encodeURIComponent(activeStudentId)}`,
          {
            cache: "no-store",
            headers: {
              ...(authTok ? { Authorization: `Bearer ${authTok}` } : {}),
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ADMITTED") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setIsCameraOn(true);
            setIsMicOn(true);
            setStage("LIVE_CLASS");
            recordAttendanceJoin(classData?.id || classId);
            return;
          } else if (data.status === "DENIED") {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setStage("DENIED");
            return;
          }
        }

        // Secondary fallback check via join route
        const joinCheck = await fetch(`/api/classes/${targetClassId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authTok ? { Authorization: `Bearer ${authTok}` } : {}),
          },
        }).catch(() => null);
        if (joinCheck && joinCheck.ok) {
          const joinData = await joinCheck.json();
          if (joinData.isAdmitted) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setIsCameraOn(true);
            setIsMicOn(true);
            setStage("LIVE_CLASS");
            recordAttendanceJoin(classData?.id || classId);
            return;
          }
        }
      } catch (e) { /* ignore poll errors */ }
    };

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(poll, 700);
    // Also poll immediately
    poll();
  }, [classId, userInfo.id, userInfo.name, classData, currentUserId]);

  // Cancel student knock when leaving lobby
  const cancelKnock = useCallback(async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    const targetClassId = classData?.id || classData?.livekitRoomId || classId;
    try {
      await fetch(`/api/classes/${targetClassId}/admit`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    } catch {}
    setStage("WAITING_ROOM");
  }, [classId, classData]);

  // Cleanup poll timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  /* ─────────────────────────────────────────────────
     3b.  TEACHER → poll pending list every 1.5 seconds & chime
  ───────────────────────────────────────────────── */
  const lastPendingCountRef = useRef(0);
  useEffect(() => {
    if (pendingCount > lastPendingCountRef.current && userInfo.isTeacher) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {}
    }
    lastPendingCountRef.current = pendingCount;
  }, [pendingCount, userInfo.isTeacher]);

  useEffect(() => {
    if (stage !== "LIVE_CLASS" || !userInfo.isTeacher) return;

    const targetClassId = classData?.id || classData?.livekitRoomId || classId;

    const fetchPending = async () => {
      try {
        const res = await fetch(`/api/classes/${targetClassId}/admit`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const pending: PendingStudent[] = data.pendingAdmissions || [];
        setPendingStudents(pending);
        setPendingCount(pending.length);
        setAdmittedList(data.admittedStudents || []);
      } catch (e) { /* ignore */ }
    };

    fetchPending();
    const timer = setInterval(fetchPending, 1500);
    return () => clearInterval(timer);
  }, [stage, userInfo.isTeacher, classId, classData]);

  /* ─────────────────────────────────────────────────
     3c.  TEACHER → admit or deny a student
  ───────────────────────────────────────────────── */
  const handleAdmitDeny = useCallback(
    async (userId: string, action: "ADMIT" | "DENY") => {
      setAdmittingId(userId);
      const targetClassId = classData?.id || classData?.livekitRoomId || classId;
      const token = typeof window !== "undefined" ? (localStorage.getItem("acuity_auth_token") || sessionStorage.getItem("acuity_auth_token")) : "";
      try {
        await fetch(`/api/classes/${targetClassId}/admit`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ userId, action }),
        });
        // Optimistically remove from pending list
        const admittedStudentName = pendingStudents.find((s) => s.userId === userId)?.name || "Student";
        setPendingStudents((prev) => prev.filter((s) => s.userId !== userId));
        setPendingCount((c) => Math.max(0, c - 1));
        if (action === "ADMIT") {
          setAdmittedList((prev) => [...prev, { userId, name: admittedStudentName }]);
        }
      } catch (e) {
        console.warn("Admit/Deny failed:", e);
      } finally {
        setAdmittingId(null);
      }
    },
    [classId, classData, pendingStudents]
  );

  /* ─────────────────────────────────────────────────
     4.  Duration timer (only while live)
  ───────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;
    const t = setInterval(() => setDurationSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [stage]);

  /* ─────────────────────────────────────────────────
     5.  Attendance heartbeat (students, every 20s)
  ───────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== "LIVE_CLASS" || userInfo.isTeacher) return;
    const t = setInterval(() => {
      fetch("/api/attendance/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      }).catch(() => {});
    }, 20_000);
    return () => clearInterval(t);
  }, [stage, classId, userInfo.isTeacher]);

  /* ─────────────────────────────────────────────────
     6.  Screen share (WebRTC track replacement)
  ───────────────────────────────────────────────── */
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      // Revert WebRTC sender to camera track
      const pc = peerConnectionRef.current;
      if (pc && localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0] || null;
        const sender = pc.getSenders().find((s) => s.track?.kind === "video" || (s as any).kind === "video");
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack).catch(() => {});
        }
      }

      // Revert local preview
      if (teacherVideoRef.current && localStreamRef.current) {
        teacherVideoRef.current.srcObject = localStreamRef.current;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" } as any,
          audio: false,
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];

        // Replace WebRTC sender track so student sees screen in real time
        const pc = peerConnectionRef.current;
        if (pc && screenTrack) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video" || (s as any).kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack).catch(() => {});
          }
        }

        // Update local teacher preview
        if (teacherVideoRef.current) {
          teacherVideoRef.current.srcObject = stream;
        }

        // Handle native browser stop sharing event
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          const pc = peerConnectionRef.current;
          if (pc && localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0] || null;
            const sender = pc.getSenders().find((s) => s.track?.kind === "video" || (s as any).kind === "video");
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack).catch(() => {});
            }
          }
          if (teacherVideoRef.current && localStreamRef.current) {
            teacherVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (e) {
        console.warn("Screen share cancelled or unsupported:", e);
        setIsScreenSharing(false);
      }
    }
  };

  /* ─────────────────────────────────────────────────
     7.  Chat
  ───────────────────────────────────────────────── */
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: userInfo.name,
        role: userInfo.role,
        text: newMessage.trim(),
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
        isSelf: true,
      },
    ]);
    setNewMessage("");
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  /* ─────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────── */
  const recordAttendanceJoin = async (id: string) => {
    try {
      await fetch("/api/attendance/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: id }),
      });
    } catch (e) { /* ignore */ }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();

  /* ══════════════════════════════════════════════
     RENDER — LOADING
  ══════════════════════════════════════════════ */
  if (stage === "LOADING") {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-slate-200">Connecting to classroom…</p>
          <p className="text-xs text-slate-500">Verifying credentials and initialising media</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — ERROR
  ══════════════════════════════════════════════ */
  if (stage === "ERROR") {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white p-6">
        <div className="max-w-sm w-full p-6 rounded-xl bg-[#1e1e1e] border border-red-900/40 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <div>
            <h2 className="text-sm font-semibold text-rose-300">Cannot Enter Classroom</h2>
            <p className="text-xs text-slate-400 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              stopAllMediaTracks();
              router.push(
                currentUserRole === "TEACHER" ? "/teacher/schedule" : "/student/classes"
              );
            }}
            className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — ENDED (Teacher concluded class)
  ══════════════════════════════════════════════ */
  if (stage === "ENDED") {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#1e1e1e] border border-white/10 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Class Completed</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The faculty instructor has concluded today&apos;s live class for {classData?.subject || "your session"}.
              Your attendance and participation have been submitted.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Class Topic:</span>
              <span className="text-white font-medium truncate max-w-[200px]">{classData?.title || classData?.topic || "Live Lecture"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration Attended:</span>
              <span className="text-emerald-400 font-mono font-semibold">{fmt(durationSeconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">Completed &amp; Recorded</span>
            </div>
          </div>
          <button
            onClick={() => router.push("/student/classes")}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            Return to Student Portal
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — DENIED
  ══════════════════════════════════════════════ */
  if (stage === "DENIED") {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center text-white p-6">
        <div className="max-w-sm w-full p-6 rounded-xl bg-[#1e1e1e] border border-orange-900/40 text-center space-y-5">
          <XCircle className="w-10 h-10 text-orange-400 mx-auto" />
          <div>
            <h2 className="text-base font-semibold text-orange-300">Entry Not Permitted</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              The teacher has not admitted you to this class session. Please contact your teacher
              or try again later.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={askToJoin}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
            >
              Request to Join Again
            </button>
            <button
              onClick={() => {
                stopAllMediaTracks();
                router.push("/student/classes");
              }}
              className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — WAITING ROOM (Pre-join lobby)
  ══════════════════════════════════════════════ */
  if (stage === "WAITING_ROOM" || stage === "PENDING_ADMISSION") {
    const isPending = stage === "PENDING_ADMISSION";

    return (
      <div className="min-h-screen bg-[#111] text-white flex flex-col font-sans">
        {/* Header */}
        <header className="h-14 px-6 flex items-center gap-2.5 border-b border-white/10">
          <Video className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            {classData?.title || `${classData?.subject || ""} Live Class`}
          </span>
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase tracking-wider">
            Live
          </span>
        </header>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-10 items-center">

            {/* Camera preview — 3 cols */}
            <div className="md:col-span-3">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/10">
                {isCameraOn ? (
                  <video
                    ref={prejoinVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold text-slate-200">
                      {initials(userInfo.name)}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Camera is standby (turns on when you click Ask to Join)</span>
                  </div>
                )}

                {/* Mic/Camera controls at bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMicOn
                        ? "bg-slate-600 hover:bg-slate-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                    title={isMicOn ? "Mute" : "Unmute"}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCameraOn
                        ? "bg-slate-600 hover:bg-slate-500 text-white"
                        : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Pending label overlay */}
                {isPending && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-sm font-medium text-amber-300">Waiting for teacher to admit you…</p>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                {isPending
                  ? "Camera is live • Join request has been sent to the teacher"
                  : "Camera will automatically activate when you click Ask to Join"}
              </p>
            </div>

            {/* Join panel — 2 cols */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold text-white">
                  {isPending ? "Waiting for admission" : "Ready to join?"}
                </h2>
                <p className="text-xs text-slate-400">
                  {classData?.teacher?.name || "Teacher"} is hosting · {classData?.subject || "Live Session"}
                </p>
              </div>

              {/* Class info */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-emerald-400">Class is live</span>
                </div>
                {classData?.topic && (
                  <p className="text-xs text-slate-300 font-medium">{classData.topic}</p>
                )}
                <p className="text-[11px] text-slate-500">
                  {classData?.startTime} – {classData?.endTime} · {classData?.classLevel}
                </p>
              </div>

              {/* Action buttons */}
              {!isPending ? (
                <div className="space-y-2.5">
                  <button
                    onClick={askToJoin}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Ask to Join</span>
                  </button>
                  <button
                    onClick={() => {
                      stopAllMediaTracks();
                      router.push("/student/classes");
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300">
                      Your request is with the teacher. Please wait — this page will update automatically.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      stopAllMediaTracks();
                      await cancelKnock();
                      router.push("/student/classes");
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel Request &amp; Leave Lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     RENDER — LIVE CLASSROOM (Jitsi Meet)
  ══════════════════════════════════════════════ */
  return (
    <div className="h-screen w-screen bg-[#111] text-white flex flex-col overflow-hidden font-sans select-none">

      {/* ── Top Bar ── */}
      <header className="h-12 px-4 bg-[#111] border-b border-white/10 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <Video className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-300 truncate">
            {classData?.subject} — {classData?.title || classData?.topic}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{fmt(durationSeconds)}</span>
          </div>
          {userInfo.isTeacher && (
            <div className="text-[11px] text-amber-400 font-semibold">
              {pendingCount > 0 ? `${pendingCount} waiting` : "All admitted"}
            </div>
          )}
          <button
            onClick={handleLeaveClass}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* ── Teacher Floating Admission Alert Banner ── */}
      {userInfo.isTeacher && pendingStudents.length > 0 && (
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between z-30 shadow-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Bell className="w-4 h-4" />
            <span>
              {pendingStudents[0].name} is waiting to join the classroom ({pendingStudents.length} student{pendingStudents.length > 1 ? "s" : ""})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdmitDeny(pendingStudents[0].userId, "ADMIT")}
              disabled={admittingId === pendingStudents[0].userId}
              className="px-3 py-1 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Admit Now
            </button>
            <button
              onClick={() => handleAdmitDeny(pendingStudents[0].userId, "DENY")}
              disabled={admittingId === pendingStudents[0].userId}
              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* ── Main: Jitsi Meet Live Video Classroom ── */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0d0d0d]">
        <div id="jitsi-meet-container" className="w-full h-full" />
        {/* Seamless fallback iframe if external_api.js script is blocked or delayed */}
        {jitsiError && (
          <iframe
            src={`https://meet.jit.si/AcuityTutoring_${classId.replace(/[^a-zA-Z0-9]/g, "")}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent((userInfoRef.current.name || userInfo.name || "Participant") + (userInfoRef.current.isTeacher ? " (Teacher)" : " (Student)"))}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
