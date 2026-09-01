"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video, VideoOff, Mic, MicOff, Users, Clock, PhoneOff,
  AlertCircle, Info, Hand, MonitorUp, MessageSquare, Send,
  Volume2, X, Loader2, CheckCircle2, XCircle, Bell,
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
  currentUserName = "Student",
  currentUserId = "",
}: JitsiClassroomProps) {
  const router = useRouter();

  /* ── State ── */
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
  const [admittedList, setAdmittedList] = useState<{ userId: string }[]>([]);
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

        if (resolvedUser.role === "TEACHER" || resolvedUser.role === "ADMIN") {
          // Teacher enters immediately and activates camera
          setIsCameraOn(true);
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

  /* ─────────────────────────────────────────────────
     2.  Camera / Mic stream management
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
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            },
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          // Sync initial audio state
          stream.getAudioTracks().forEach((t) => (t.enabled = isMicOn));
        }

        const ref =
          stage === "WAITING_ROOM" || stage === "PENDING_ADMISSION"
            ? prejoinVideoRef.current
            : userInfo.isTeacher
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
  }, [isCameraOn, stage, userInfo.isTeacher, stopAllMediaTracks]);

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
  }, [stage, userInfo.isTeacher, hasRemoteVideo, remoteParticipant?.id]);

  /* ─────────────────────────────────────────────────
     2b.  WebRTC Peer-to-Peer Streaming (Teacher <-> Student)
  ───────────────────────────────────────────────── */
  const addTracksToPeerConnection = useCallback((pc: RTCPeerConnection) => {
    const stream = screenStreamRef.current || localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      const senders = pc.getSenders();
      const existingSender = senders.find((s) => s.track?.kind === track.kind || (s as any).kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track).catch(() => {});
      } else {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;

    let pc = peerConnectionRef.current;
    if (!pc) {
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      });
      peerConnectionRef.current = pc;

      // Add local media tracks to peer connection
      addTracksToPeerConnection(pc);

      // Handle incoming remote audio/video tracks
      pc.ontrack = (event) => {
        let stream = event.streams[0];
        if (!stream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          stream = remoteStreamRef.current;
        } else {
          remoteStreamRef.current = stream;
        }
        setHasRemoteVideo(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
      };

      const targetClassId = classData?.id || classData?.livekitRoomId || classId;

      // Send local ICE candidates to server signaling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`/api/classes/${targetClassId}/signal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: userInfo.id,
              name: userInfo.name,
              role: userInfo.role,
              type: "candidate",
              data: event.candidate,
            }),
          }).catch(() => {});
        }
      };
    }

    const targetClassId = classData?.id || classData?.livekitRoomId || classId;
    let lastSignalTime = 0;
    let isCreatingOffer = false;

    // Send immediate "I am in the classroom" broadcast so remote peer knows we entered
    fetch(`/api/classes/${targetClassId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: userInfo.id,
        name: userInfo.name,
        role: userInfo.role,
        type: "CLIENT_JOINED",
        isCameraOn: isCameraOnRef.current,
        isMicOn: isMicOnRef.current,
        isScreenSharing: isScreenSharingRef.current,
      }),
    }).catch(() => {});

    // Polling loop for WebRTC signals (Offers, Answers, ICE Candidates)
    const signalInterval = setInterval(async () => {
      try {
        const activePC = peerConnectionRef.current;
        if (activePC) addTracksToPeerConnection(activePC);

        // Send heartbeat & presence
        await fetch(`/api/classes/${targetClassId}/signal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: userInfo.id,
            name: userInfo.name,
            role: userInfo.role,
            isCameraOn: isCameraOnRef.current,
            isMicOn: isMicOnRef.current,
            isScreenSharing: isScreenSharingRef.current,
          }),
        });

        // Fetch pending signals
        const res = await fetch(`/api/classes/${targetClassId}/signal?userId=${userInfo.id}&since=${lastSignalTime}`);
        if (!res.ok) return;
        const data = await res.json();
        lastSignalTime = data.serverTime || Date.now();

        // Check if teacher concluded the class
        if (data.isEnded || (data.signals && data.signals.some((s: any) => s.type === "CLASS_ENDED"))) {
          if (!userInfo.isTeacher) {
            stopAllMedia();
            if (peerConnectionRef.current) {
              peerConnectionRef.current.close();
              peerConnectionRef.current = null;
            }
            setStage("ENDED");
            return;
          }
        }

        // Update participants list
        if (data.participants) {
          setRealtimeParticipants(data.participants);
          const other = data.participants.find((p: any) => p.id !== userInfo.id);
          if (other) {
            setRemoteParticipant(other);
          } else {
            setRemoteParticipant(null);
          }
        }

        // Process WebRTC signals
        for (const sig of data.signals || []) {
          if (sig.type === "CLIENT_JOINED" && userInfo.isTeacher && activePC) {
            if (activePC.signalingState === "have-local-offer") {
              await activePC.setLocalDescription({ type: "rollback" } as any).catch(() => {});
            }
            addTracksToPeerConnection(activePC);
            const offer = await activePC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await activePC.setLocalDescription(offer);
            await fetch(`/api/classes/${targetClassId}/signal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: userInfo.id,
                name: userInfo.name,
                role: userInfo.role,
                to: sig.from,
                type: "offer",
                data: offer,
              }),
            });
          } else if (sig.type === "offer" && !userInfo.isTeacher && activePC) {
            addTracksToPeerConnection(activePC);
            await activePC.setRemoteDescription(new RTCSessionDescription(sig.data));

            // Flush queued candidates
            while (queuedIceCandidatesRef.current.length > 0) {
              const c = queuedIceCandidatesRef.current.shift();
              if (c) try { await activePC.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
            }

            const answer = await activePC.createAnswer();
            await activePC.setLocalDescription(answer);
            await fetch(`/api/classes/${targetClassId}/signal`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: userInfo.id,
                name: userInfo.name,
                role: userInfo.role,
                to: sig.from,
                type: "answer",
                data: answer,
              }),
            });
          } else if (sig.type === "answer" && userInfo.isTeacher && activePC) {
            if (activePC.signalingState === "have-local-offer") {
              await activePC.setRemoteDescription(new RTCSessionDescription(sig.data));
              // Flush queued candidates
              while (queuedIceCandidatesRef.current.length > 0) {
                const c = queuedIceCandidatesRef.current.shift();
                if (c) try { await activePC.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
              }
            }
          } else if (sig.type === "candidate" && activePC) {
            if (activePC.remoteDescription && activePC.remoteDescription.type) {
              try {
                await activePC.addIceCandidate(new RTCIceCandidate(sig.data));
              } catch (e) {}
            } else {
              queuedIceCandidatesRef.current.push(sig.data);
            }
          }
        }

        // If Teacher and student is detected, initiate offer
        if (userInfo.isTeacher && activePC && !isCreatingOffer) {
          const other = data.participants?.find((p: any) => p.id !== userInfo.id);
          if (other) {
            if (activePC.signalingState === "have-local-offer" && !hasRemoteVideo) {
              await activePC.setLocalDescription({ type: "rollback" } as any).catch(() => {});
            }
            if (activePC.signalingState === "stable") {
              isCreatingOffer = true;
              addTracksToPeerConnection(activePC);
              const offer = await activePC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
              await activePC.setLocalDescription(offer);
              await fetch(`/api/classes/${targetClassId}/signal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  senderId: userInfo.id,
                  name: userInfo.name,
                  role: userInfo.role,
                  to: other.id,
                  type: "offer",
                  data: offer,
                }),
              });
              isCreatingOffer = false;
            }
          }
        }
      } catch (err) {
        // quiet error handling
      }
    }, 1000);

    return () => {
      clearInterval(signalInterval);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [stage, userInfo.id, userInfo.name, userInfo.role, userInfo.isTeacher, classId, classData?.id, classData?.livekitRoomId, addTracksToPeerConnection, stopAllMedia]);

  /* ─────────────────────────────────────────────────
     3a.  STUDENT → knock & poll for admission
  ───────────────────────────────────────────────── */
  const askToJoin = useCallback(async () => {
    setIsCameraOn(true);
    setStage("PENDING_ADMISSION");

    const targetClassId = classData?.id || classData?.livekitRoomId || classId;

    // Send knock
    try {
      await fetch(`/api/classes/${targetClassId}/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userInfo.name }),
      });
    } catch (e) {
      console.warn("Knock failed:", e);
    }

    // Start polling every 800ms for instant admission
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/classes/${targetClassId}/admit?userId=${userInfo.id}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.status === "ADMITTED") {
          clearInterval(pollTimerRef.current!);
          setIsCameraOn(true);
          setIsMicOn(true);
          setStage("LIVE_CLASS");
          recordAttendanceJoin(classData?.id || classId);
        } else if (data.status === "DENIED") {
          clearInterval(pollTimerRef.current!);
          setStage("DENIED");
        }
      } catch (e) { /* ignore poll errors */ }
    };

    pollTimerRef.current = setInterval(poll, 800);
    // Also poll immediately
    poll();
  }, [classId, userInfo.id, userInfo.name, classData]);

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
      try {
        await fetch(`/api/classes/${targetClassId}/admit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });
        // Optimistically remove from pending list
        setPendingStudents((prev) => prev.filter((s) => s.userId !== userId));
        setPendingCount((c) => Math.max(0, c - 1));
        if (action === "ADMIT") {
          setAdmittedList((prev) => [...prev, { userId }]);
        }
      } catch (e) {
        console.warn("Admit/Deny failed:", e);
      } finally {
        setAdmittingId(null);
      }
    },
    [classId, classData]
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
     8.  Leave class
  ───────────────────────────────────────────────── */
  const handleLeaveClass = async () => {
    stopAllMediaTracks();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    stopAllMedia();
    const targetClassId = classData?.id || classData?.livekitRoomId || classId;

    if (userInfo.isTeacher) {
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
        // 1. Remove from admitted & pending lists so next visit requires new admission
        await fetch(`/api/classes/${targetClassId}/admit`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {}

      try {
        // 2. Record attendance duration
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
     RENDER — LIVE CLASSROOM
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

        <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{fmt(durationSeconds)}</span>
          </div>
          {userInfo.isTeacher && (
            <div className="text-[11px] text-amber-400 font-semibold">
              {pendingCount > 0 ? `${pendingCount} waiting` : "All admitted"}
            </div>
          )}
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
            {pendingStudents.length > 1 && (
              <button
                onClick={() => setActiveSidebar("PEOPLE")}
                className="text-xs font-bold underline ml-1 cursor-pointer"
              >
                View All ({pendingStudents.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main: Video Grid + Sidebar ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Grid */}
        <div className="flex-1 p-3 flex gap-3 overflow-hidden">

          {/* Teacher tile */}
          <div className="flex-1 relative rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/10 flex items-center justify-center min-w-0">
            {userInfo.isTeacher ? (
              (isCameraOn || isScreenSharing) ? (
                <video
                  ref={teacherVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${isScreenSharing ? "object-contain bg-black" : "object-cover -scale-x-100"}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-semibold text-slate-200">
                    {initials(userInfo.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{userInfo.name} (You)</p>
                    <span className="text-xs text-slate-400">Camera is off</span>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
                {!hasRemoteVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4 bg-[#1e1e1e]">
                    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-semibold text-slate-200">
                      {initials(classData?.teacher?.name || "TC")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{classData?.teacher?.name || "Faculty Teacher"}</p>
                      <span className="text-xs text-slate-400">Connecting video feed...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-[11px] font-medium text-white flex items-center gap-1.5 z-10">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>{userInfo.isTeacher ? `${userInfo.name} (You)` : (classData?.teacher?.name || "Teacher")} · {isScreenSharing && userInfo.isTeacher ? "Screen Sharing" : "Host"}</span>
            </div>
          </div>

          {/* Student / Peer tile — Only render if a remote student exists or if user is student */}
          {(!userInfo.isTeacher || remoteParticipant) && (
            <div className="flex-1 relative rounded-xl overflow-hidden bg-[#1e1e1e] border border-white/10 flex items-center justify-center min-w-0">
              {!userInfo.isTeacher ? (
                isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold text-slate-200">
                      {initials(userInfo.name)}
                    </div>
                    <span className="text-xs text-slate-500">{userInfo.name} (You)</span>
                  </div>
                )
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!hasRemoteVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1e1e1e]">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-semibold text-slate-200">
                        {initials(remoteParticipant?.name || "ST")}
                      </div>
                      <span className="text-xs text-slate-400">{remoteParticipant?.name || "Student"}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-[11px] font-medium text-white flex items-center gap-1.5 z-10">
                {(!userInfo.isTeacher ? isMicOn : remoteParticipant?.isMicOn !== false)
                  ? <Mic className="w-3 h-3 text-emerald-400" />
                  : <MicOff className="w-3 h-3 text-rose-400" />}
                <span>{!userInfo.isTeacher ? `${userInfo.name} (You)` : (remoteParticipant?.name || "Student")}</span>
              </div>
              {isHandRaised && !userInfo.isTeacher && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-amber-500 text-[10px] font-bold text-black flex items-center gap-1 z-10">
                  <Hand className="w-3 h-3" />
                  Hand Raised
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        {activeSidebar !== "NONE" && (
          <aside className="w-80 h-full bg-[#1a1a1a] border-l border-white/10 flex flex-col shrink-0">
            <div className="h-12 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <h3 className="text-sm font-semibold text-white">
                {activeSidebar === "CHAT"   && "In-call Messages"}
                {activeSidebar === "PEOPLE" && "Participants"}
                {activeSidebar === "INFO"   && "Class Details"}
              </h3>
              <button
                onClick={() => setActiveSidebar("NONE")}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* ── Chat ── */}
              {activeSidebar === "CHAT" && (
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No messages yet. Send a message to the class!</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}
                        >
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-[10px] font-medium text-slate-400">{m.sender}</span>
                            <span className="text-[9px] text-slate-600">{m.time}</span>
                          </div>
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                              m.isSelf
                                ? "bg-blue-600 text-white rounded-br-xs"
                                : "bg-white/10 text-slate-100 rounded-bl-xs"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Message everyone…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* ── People ── */}
              {activeSidebar === "PEOPLE" && (
                <div className="space-y-4">
                  {/* Teacher admit panel — visible to teacher only */}
                  {userInfo.isTeacher && pendingStudents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Bell className="w-3 h-3" />
                        Waiting to Join ({pendingStudents.length})
                      </p>
                      <div className="space-y-2">
                        {pendingStudents.map((s) => (
                          <div
                            key={s.userId}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-200 shrink-0">
                                {initials(s.name)}
                              </div>
                              <p className="text-xs font-medium text-white truncate">{s.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleAdmitDeny(s.userId, "ADMIT")}
                                disabled={admittingId === s.userId}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {admittingId === s.userId
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <CheckCircle2 className="w-3 h-3" />}
                                Admit
                              </button>
                              <button
                                onClick={() => handleAdmitDeny(s.userId, "DENY")}
                                disabled={admittingId === s.userId}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                Deny
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* In call — Real Connected Participants Only */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      In This Call ({1 + realtimeParticipants.filter((p) => p.id !== userInfo.id).length})
                    </p>

                    {/* Self */}
                    <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-semibold text-white">
                          {initials(userInfo.name)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{userInfo.name} (You)</p>
                          <p className="text-[10px] text-slate-500">{userInfo.isTeacher ? "Host" : "Student"}</p>
                        </div>
                      </div>
                      {isMicOn
                        ? <Mic className="w-3.5 h-3.5 text-emerald-400" />
                        : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    </div>

                    {/* Other connected real participants */}
                    {realtimeParticipants.filter((p) => p.id !== userInfo.id).map((p) => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-200">
                            {initials(p.name)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.role === "TEACHER" || p.role === "ADMIN" ? "Host" : "Student"}</p>
                          </div>
                        </div>
                        {p.isMicOn !== false
                          ? <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Info ── */}
              {activeSidebar === "INFO" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Topic</p>
                    <p className="text-sm font-semibold text-white">{classData?.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{classData?.description || "Interactive problem solving session."}</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="space-y-2.5">
                    {[
                      ["Schedule",  `${classData?.startTime} – ${classData?.endTime}`],
                      ["Grade",     classData?.classLevel || "—"],
                      ["Faculty",   classData?.teacher?.name || "—"],
                      ["Attendance","≥ 75% required"],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-white font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <footer className="h-16 bg-[#111] border-t border-white/10 flex items-center justify-between px-5 shrink-0 z-20">

        {/* Left: duration */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono min-w-[80px]">
          <span>{fmt(durationSeconds)}</span>
          <span>·</span>
          <span className="truncate max-w-[100px]">{classData?.subject}</span>
        </div>

        {/* Center: media controls */}
        <div className="flex items-center gap-2.5 mx-auto">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            }`}
            title={isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {isMicOn ? <Mic className="w-[18px] h-[18px]" /> : <MicOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isCameraOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isHandRaised ? "bg-amber-500 text-black" : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="w-[18px] h-[18px]" />
          </button>

          {userInfo.isTeacher && (
            <button
              onClick={toggleScreenShare}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
              title="Share screen"
            >
              <MonitorUp className="w-[18px] h-[18px]" />
            </button>
          )}

          <button
            onClick={handleLeaveClass}
            className="h-10 px-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 ml-2 cursor-pointer transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right: sidebar toggles */}
        <div className="flex items-center gap-1 min-w-[80px] justify-end">
          <button
            onClick={() => setActiveSidebar(activeSidebar === "INFO" ? "NONE" : "INFO")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeSidebar === "INFO" ? "bg-slate-700 text-white" : "hover:bg-slate-700 text-slate-400"
            }`}
          >
            <Info className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === "PEOPLE" ? "NONE" : "PEOPLE")}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeSidebar === "PEOPLE" ? "bg-slate-700 text-white" : "hover:bg-slate-700 text-slate-400"
            }`}
          >
            <Users className="w-[18px] h-[18px]" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === "CHAT" ? "NONE" : "CHAT")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeSidebar === "CHAT" ? "bg-slate-700 text-white" : "hover:bg-slate-700 text-slate-400"
            }`}
          >
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>
        </div>
      </footer>
    </div>
  );
}
