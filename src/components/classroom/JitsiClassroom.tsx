"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video, VideoOff, Mic, MicOff, Users, Clock, PhoneOff,
  AlertCircle, Info, Hand, MonitorUp, MessageSquare, Send,
  Volume2, X, Loader2, CheckCircle2, XCircle, Bell, Smile,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  VideoPresets,
  ScreenSharePresets,
} from "livekit-client";

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
  const livekitRoomRef     = useRef<Room | null>(null);
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
  const [remoteParticipant, setRemoteParticipant] = useState<{ id: string; name: string; role: string; isCameraOn?: boolean; isMicOn?: boolean; lastSeen?: number; isHandRaised?: boolean } | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [realtimeParticipants, setRealtimeParticipants] = useState<{ id: string; name: string; role: string; isCameraOn?: boolean; isMicOn?: boolean; lastSeen?: number; isHandRaised?: boolean }[]>([]);
  const [remoteHandRaised, setRemoteHandRaised] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const isRemoteScreenSharingRef = useRef(false);
  useEffect(() => { isRemoteScreenSharingRef.current = isRemoteScreenSharing; }, [isRemoteScreenSharing]);

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
      if (livekitRoomRef.current) {
        try {
          livekitRoomRef.current.localParticipant.trackPublications.forEach((pub) => {
            try {
              pub.track?.stop();
            } catch (e) {}
          });
          livekitRoomRef.current.disconnect(true);
        } catch (e) {}
        livekitRoomRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
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
            track.enabled = false;
          } catch (e) {
            console.warn("Screen track stop error:", e);
          }
        });
        screenStreamRef.current = null;
      }
      if (prejoinVideoRef.current) prejoinVideoRef.current.srcObject = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (teacherVideoRef.current) teacherVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    } catch (err) {
      console.warn("stopAllMediaTracks error:", err);
    }
  }, []);

  // Global unmount & window pageleave cleanup (ensures webcam hardware light turns off immediately)
  useEffect(() => {
    const handleLeaveWindow = () => {
      const curUserId = userInfoRef.current.id || currentUserId;
      if (curUserId) {
        try {
          fetch(`/api/classes/${classId}/signal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              senderId: curUserId,
              type: "CLIENT_LEFT",
            }),
          }).catch(() => {});
        } catch {}
      }
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
  }, [stopAllMediaTracks, classId, currentUserId]);

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
        const transceivers = pc.getTransceivers();
        const matchingTransceiver = transceivers.find(
          (t) => t.sender.track?.kind === track.kind || t.receiver?.track?.kind === track.kind
        );
        if (matchingTransceiver) {
          matchingTransceiver.sender.replaceTrack(track).catch(() => {});
        } else {
          try {
            pc.addTrack(track, stream);
          } catch (e) {
            console.warn("addTrack error:", e);
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

  const handleLeaveClass = useCallback(async () => {
    stopAllMediaTracks();
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    stopAllMedia();
    const curUserId = userInfoRef.current.id || currentUserId;

    // Send immediate CLIENT_LEFT signal to notify remote peer
    try {
      fetch(`/api/classes/${classId}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          senderId: curUserId,
          type: "CLIENT_LEFT",
        }),
      }).catch(() => {});
    } catch {}

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
     2c.  Camera, Mic & Screen Share Controls
  ───────────────────────────────────────────────── */
  const toggleCamera = useCallback(async () => {
    const nextState = !isCameraOn;
    setIsCameraOn(nextState);
    isCameraOnRef.current = nextState;
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setCameraEnabled(nextState);
        if (nextState) {
          const camPub = livekitRoomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.videoTrack) {
            const el = userInfoRef.current.isTeacher ? teacherVideoRef.current : localVideoRef.current;
            if (el) camPub.videoTrack.attach(el);
          }
        }
      } catch (e) {
        console.warn("LiveKit toggle camera error:", e);
      }
    }
  }, [isCameraOn]);

  const toggleMic = useCallback(async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    isMicOnRef.current = nextState;
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      } catch (e) {
        console.warn("LiveKit toggle mic error:", e);
      }
    }
  }, [isMicOn]);

  const toggleScreenShare = useCallback(async () => {
    const nextState = !isScreenSharing;
    setIsScreenSharing(nextState);
    isScreenSharingRef.current = nextState;
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setScreenShareEnabled(nextState, {
          audio: true,
          selfBrowserSurface: "include",
          surfaceSwitching: "include",
          resolution: ScreenSharePresets.h1080fps30.resolution,
        });
        if (nextState) {
          const screenPub = livekitRoomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare);
          if (screenPub?.videoTrack && teacherVideoRef.current) {
            screenPub.videoTrack.attach(teacherVideoRef.current);
          }
        } else {
          const camPub = livekitRoomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.videoTrack && teacherVideoRef.current) {
            camPub.videoTrack.attach(teacherVideoRef.current);
          }
        }
      } catch (e) {
        console.warn("LiveKit screen share error:", e);
        setIsScreenSharing(false);
        isScreenSharingRef.current = false;
      }
    }
  }, [isScreenSharing]);

  /* ─────────────────────────────────────────────────
     2d.  LiveKit Cloud Video & Audio Streaming (Teacher <-> Student)
  ───────────────────────────────────────────────── */
  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;

    let isDisposed = false;
    let roomInstance: Room | null = null;

    async function initLivekit() {
      try {
        const authTok = typeof window !== "undefined" ? (localStorage.getItem("acuity_auth_token") || sessionStorage.getItem("acuity_auth_token")) : "";
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(authTok ? { Authorization: `Bearer ${authTok}` } : {}),
          },
          body: JSON.stringify({ sessionId: classId }),
        });
        if (!res.ok) {
          console.warn("Failed to fetch LiveKit token, status:", res.status);
          return;
        }
        const { token, serverUrl } = await res.json();
        if (!token || !serverUrl || isDisposed) return;

        // Optimized for low latency 30fps screen share & crisp video without transcode lag
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
          publishDefaults: {
            simulcast: false,
            videoCodec: "vp8",
            screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
            videoEncoding: VideoPresets.h720.encoding,
          },
        });
        roomInstance = room;
        livekitRoomRef.current = room;

        const syncRoomParticipants = () => {
          const list: Array<{ id: string; name: string; role: string; isCameraOn?: boolean; isMicOn?: boolean; lastSeen?: number }> = [];
          room.remoteParticipants.forEach((p) => {
            const isPTeacher = p.identity === classData?.teacherId || p.identity === (classData?.teacherId as any)?._id?.toString();
            const hasCam = Array.from(p.trackPublications.values()).some((pub) => pub.source === Track.Source.Camera && pub.isSubscribed && !pub.isMuted);
            const hasMic = Array.from(p.trackPublications.values()).some((pub) => pub.source === Track.Source.Microphone && pub.isSubscribed && !pub.isMuted);
            list.push({
              id: p.identity,
              name: p.name || "Student",
              role: isPTeacher ? "TEACHER" : "STUDENT",
              isCameraOn: hasCam,
              isMicOn: hasMic,
              lastSeen: Date.now(),
            });
          });
          setRealtimeParticipants(list);
          if (list.length > 0) {
            setRemoteParticipant(list[0]);
          } else {
            setRemoteParticipant(null);
          }
        };

        // Remote track subscribed (Video, Audio, or Screen Share)
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Video) {
            setHasRemoteVideo(true);
            hasRemoteVideoRef.current = true;
            if (publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare) {
              setIsRemoteScreenSharing(true);
              isRemoteScreenSharingRef.current = true;
              if (remoteVideoRef.current) track.attach(remoteVideoRef.current);
            } else if (!isRemoteScreenSharingRef.current && remoteVideoRef.current) {
              track.attach(remoteVideoRef.current);
            }
          }
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.id = `lk-audio-${participant.identity}`;
            document.body.appendChild(el);
          }
          syncRoomParticipants();
        });

        // Remote track unsubscribed
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          track.detach();
          const el = document.getElementById(`lk-audio-${participant.identity}`);
          if (el) el.remove();

          if (publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare) {
            setIsRemoteScreenSharing(false);
            isRemoteScreenSharingRef.current = false;
            // Switch back to remote camera track
            const camPub = participant.getTrackPublication(Track.Source.Camera);
            if (camPub?.videoTrack && remoteVideoRef.current) {
              camPub.videoTrack.attach(remoteVideoRef.current);
            }
          } else if (track.kind === Track.Kind.Video && !isRemoteScreenSharingRef.current) {
            setHasRemoteVideo(false);
            hasRemoteVideoRef.current = false;
          }
          syncRoomParticipants();
        });

        // Participant state changes
        room.on(RoomEvent.ParticipantConnected, () => syncRoomParticipants());
        room.on(RoomEvent.ParticipantDisconnected, () => {
          setHasRemoteVideo(false);
          hasRemoteVideoRef.current = false;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          syncRoomParticipants();
        });
        room.on(RoomEvent.TrackMuted, () => syncRoomParticipants());
        room.on(RoomEvent.TrackUnmuted, () => syncRoomParticipants());

        // Realtime DataChannel messages (Chat, Hand Raise, Reactions)
        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
          try {
            const str = new TextDecoder().decode(payload);
            const data = JSON.parse(str);

            if (data.type === "CHAT_MESSAGE") {
              setMessages((prev) => {
                if (prev.some((m) => m.id === data.id)) return prev;
                return [
                  ...prev,
                  {
                    id: data.id,
                    sender: data.sender || participant?.name || "Peer",
                    role: data.senderRole || "STUDENT",
                    text: data.text,
                    time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isSelf: false,
                  },
                ];
              });
              setTimeout(() => {
                chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            } else if (data.type === "HAND_RAISE") {
              setRemoteHandRaised(Boolean(data.isHandRaised));
              if (data.isHandRaised) {
                const rxId = `${Date.now()}-hand`;
                setReactions((prev) => [
                  ...prev.slice(-15),
                  {
                    id: rxId,
                    emoji: "✋",
                    senderName: `${data.senderName || participant?.name || "Student"} raised hand`,
                    x: 45 + Math.random() * 10,
                  },
                ]);
                setTimeout(() => {
                  setReactions((prev) => prev.filter((r) => r.id !== rxId));
                }, 3500);
              }
            } else if (data.type === "REACTION") {
              const rxId = `${Date.now()}-${Math.random()}`;
              setReactions((prev) => [
                ...prev.slice(-15),
                {
                  id: rxId,
                  emoji: data.emoji,
                  senderName: participant?.name || data.senderName || "Peer",
                  x: 25 + Math.random() * 50,
                },
              ]);
              setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== rxId));
              }, 2800);
            }
          } catch {}
        });

        await room.connect(serverUrl, token);
        syncRoomParticipants();

        // Enable local camera and mic
        await room.localParticipant.setCameraEnabled(isCameraOnRef.current);
        await room.localParticipant.setMicrophoneEnabled(isMicOnRef.current);

        // Attach local camera video track to local preview
        const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
        if (camPub?.videoTrack) {
          const localEl = userInfoRef.current.isTeacher ? teacherVideoRef.current : localVideoRef.current;
          if (localEl) {
            camPub.videoTrack.attach(localEl);
          }
        }
      } catch (err) {
        console.warn("LiveKit connection error:", err);
      }
    }

    initLivekit();

    return () => {
      isDisposed = true;
      if (roomInstance) {
        try {
          roomInstance.disconnect();
        } catch (e) {}
      }
      livekitRoomRef.current = null;
    };
  }, [stage, classId, classData?.teacherId]);

  /* ── Live Hand Raise Handler ── */
  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    const curName = userInfoRef.current.name || userInfo.name || "You";
    const curUserId = userInfoRef.current.id || currentUserId;

    if (nextState) {
      const rxId = `${Date.now()}-self-hand`;
      setReactions((prev) => [
        ...prev.slice(-15),
        {
          id: rxId,
          emoji: "✋",
          senderName: "You raised hand",
          x: 45,
        },
      ]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== rxId));
      }, 3000);
    }

    if (livekitRoomRef.current) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: "HAND_RAISE",
            senderId: curUserId,
            senderName: curName,
            isHandRaised: nextState,
          })
        );
        livekitRoomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (e) {}
    }
  }, [isHandRaised, currentUserId, userInfo.name]);

  /* ── Live Chat Message Handler ── */
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;
    setNewMessage("");

    const msgId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const curName = userInfoRef.current.name || userInfo.name || "You";
    const curRole = userInfoRef.current.isTeacher ? "TEACHER" : "STUDENT";

    const msg: ChatMessage = {
      id: msgId,
      sender: curName,
      role: curRole,
      text,
      time: timeStr,
      isSelf: true,
    };

    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    if (livekitRoomRef.current) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: "CHAT_MESSAGE",
            id: msgId,
            text,
            sender: curName,
            senderRole: curRole,
            time: timeStr,
          })
        );
        livekitRoomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (err) {
        console.warn("LiveKit publish chat error:", err);
      }
    }
  }, [newMessage, userInfo.name]);

  /* ── Send Reaction Handler ── */
  const sendReaction = useCallback((emoji: string) => {
    const rxId = `${Date.now()}-${Math.random()}`;
    const newReaction: FloatingReaction = {
      id: rxId,
      emoji,
      senderName: userInfoRef.current.name || userInfo.name || "You",
      x: 25 + Math.random() * 50,
    };
    setReactions((prev) => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== rxId));
    }, 2800);

    if (livekitRoomRef.current) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({
            type: "REACTION",
            emoji,
            senderName: userInfoRef.current.name || userInfo.name || "You",
          })
        );
        livekitRoomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (e) {}
    }

    const curUserId = userInfoRef.current.id || currentUserId;
    fetch(`/api/classes/${classId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: curUserId,
        name: userInfoRef.current.name || userInfo.name,
        role: userInfoRef.current.role || userInfo.role,
        type: "REACTION",
        data: { emoji, id: rxId },
      }),
    }).catch(() => {});
  }, [classId, currentUserId, userInfo.name, userInfo.role]);

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

      {/* ── Main: Video Grid + Sidebar ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Grid: 2-tile split (Vertical on mobile, Horizontal on desktop) */}
        <div className="flex-1 p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 overflow-hidden relative">

          {/* Floating live reactions overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-12 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 shadow-lg text-white animate-float-reaction pointer-events-none"
                style={{ left: `${r.x}%` }}
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-xs font-semibold text-slate-200">{r.senderName}</span>
              </div>
            ))}
          </div>

          {/* Teacher tile */}
          <div className="flex-1 w-full sm:w-1/2 h-1/2 sm:h-full relative rounded-xl overflow-hidden bg-[#181818] border border-white/10 flex items-center justify-center min-h-0 min-w-0">
            {userInfo.isTeacher ? (
              (isCameraOn || isScreenSharing) ? (
                <video
                  ref={(el) => {
                    teacherVideoRef.current = el;
                    if (el) {
                      const stream = screenStreamRef.current || localStreamRef.current;
                      if (stream && el.srcObject !== stream) {
                        el.srcObject = stream;
                      }
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${isScreenSharing ? "object-contain bg-black" : "object-cover -scale-x-100"}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-700 flex items-center justify-center text-xl sm:text-2xl font-semibold text-slate-200">
                    {initials(userInfo.name)}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-white">{userInfo.name} (You)</p>
                    <span className="text-[11px] sm:text-xs text-slate-400">Camera is off</span>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={(el) => {
                    remoteVideoRef.current = el;
                    if (el && remoteStreamRef.current) {
                      if (el.srcObject !== remoteStreamRef.current) {
                        el.srcObject = remoteStreamRef.current;
                      }
                      el.play().catch(() => {
                        el.muted = true;
                        el.play().catch(() => {});
                      });
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                {!hasRemoteVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4 bg-[#181818]">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-700 flex items-center justify-center text-xl sm:text-2xl font-semibold text-slate-200">
                      {initials(classData?.teacher?.name || "TC")}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white">{classData?.teacher?.name || "Faculty Teacher"}</p>
                      <span className="text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Connecting faculty live video...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-[10px] sm:text-[11px] font-medium text-white flex items-center gap-1.5 z-10">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>{userInfo.isTeacher ? `${userInfo.name} (You)` : (classData?.teacher?.name || "Teacher")} · {isScreenSharing && userInfo.isTeacher ? "Screen Sharing" : "Host"}</span>
            </div>
          </div>

          {/* Student tile */}
          <div className="flex-1 w-full sm:w-1/2 h-1/2 sm:h-full relative rounded-xl overflow-hidden bg-[#181818] border border-white/10 flex items-center justify-center min-h-0 min-w-0">
            {!userInfo.isTeacher ? (
              isCameraOn ? (
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el) {
                      if (localStreamRef.current && el.srcObject !== localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                      }
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-4">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-700 flex items-center justify-center text-xl sm:text-2xl font-semibold text-slate-200">
                    {initials(userInfo.name)}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-white">{userInfo.name} (You)</p>
                    <span className="text-[11px] sm:text-xs text-slate-400">Camera is off</span>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={(el) => {
                    remoteVideoRef.current = el;
                    if (el && remoteStreamRef.current) {
                      if (el.srcObject !== remoteStreamRef.current) {
                        el.srcObject = remoteStreamRef.current;
                      }
                      el.play().catch(() => {
                        el.muted = true;
                        el.play().catch(() => {});
                      });
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
                {!hasRemoteVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#181818] text-center px-4">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-700 flex items-center justify-center text-xl sm:text-2xl font-semibold text-slate-200">
                      {initials(remoteParticipant?.name || admittedList[0]?.name || "Student")}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-white">{remoteParticipant?.name || admittedList[0]?.name || "Student"}</p>
                      <span className="text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {remoteParticipant ? "Connecting student live video..." : "Class is live • Waiting for student to join..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/70 text-[10px] sm:text-[11px] font-medium text-white flex items-center gap-1.5 z-10">
              {(!userInfo.isTeacher ? isMicOn : remoteParticipant?.isMicOn !== false)
                ? <Mic className="w-3 h-3 text-emerald-400" />
                : <MicOff className="w-3 h-3 text-rose-400" />}
              <span>{!userInfo.isTeacher ? `${userInfo.name} (You)` : (remoteParticipant?.name || admittedList[0]?.name || "Student")}</span>
            </div>
            {isHandRaised && !userInfo.isTeacher && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-amber-500 text-[10px] font-bold text-black flex items-center gap-1 z-10">
                <Hand className="w-3 h-3" />
                Hand Raised
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        {activeSidebar !== "NONE" && (
          <aside className="w-80 bg-[#161616] border-l border-white/10 flex flex-col shrink-0 z-20">
            <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSidebar("PEOPLE")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeSidebar === "PEOPLE" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  People
                  {pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveSidebar("CHAT")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeSidebar === "CHAT" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveSidebar("INFO")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeSidebar === "INFO" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Details
                </button>
              </div>
              <button
                onClick={() => setActiveSidebar("NONE")}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeSidebar === "PEOPLE" && (
                <div className="space-y-4">
                  {userInfo.isTeacher && pendingStudents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                        Waiting Room ({pendingStudents.length})
                      </p>
                      {pendingStudents.map((s) => (
                        <div key={s.userId} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">{s.name}</p>
                            <p className="text-[10px] text-slate-400">Waiting to join</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAdmitDeny(s.userId, "ADMIT")}
                              disabled={admittingId === s.userId}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Admit
                            </button>
                            <button
                              onClick={() => handleAdmitDeny(s.userId, "DENY")}
                              disabled={admittingId === s.userId}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      In This Call ({1 + realtimeParticipants.filter((p) => p.id !== userInfo.id).length})
                    </p>
                    <div className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-[10px] font-semibold text-white">
                          {initials(userInfo.name)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white flex items-center gap-1.5">
                            {userInfo.name} (You)
                            {isHandRaised && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold flex items-center gap-0.5">
                                ✋ Raised
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500">{userInfo.isTeacher ? "Host" : "Student"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isCameraOn && <Video className="w-3.5 h-3.5 text-blue-400" />}
                        {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    </div>

                    {realtimeParticipants.filter((p) => p.id !== userInfo.id).map((p) => {
                      const isHandUp = p.isHandRaised || (remoteParticipant?.id === p.id && remoteHandRaised);
                      return (
                        <div key={p.id} className="p-2.5 rounded-lg bg-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-200">
                              {initials(p.name)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white flex items-center gap-1.5">
                                {p.name}
                                {isHandUp && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold flex items-center gap-0.5">
                                    ✋ Raised
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {p.role === "TEACHER" || p.role === "ADMIN" ? "Host" : "Student"} · Live
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {p.isCameraOn && <Video className="w-3.5 h-3.5 text-blue-400" />}
                            {p.isMicOn !== false ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                        </div>
                      );
                    })}

                    {userInfo.isTeacher && admittedList.filter(a => !realtimeParticipants.some(p => p.id === a.userId)).length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                          Admitted / Offline ({admittedList.filter(a => !realtimeParticipants.some(p => p.id === a.userId)).length})
                        </p>
                        {admittedList.filter(a => !realtimeParticipants.some(p => p.id === a.userId)).map((a) => (
                          <div key={a.userId} className="p-2 rounded bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
                            <span>{a.name || "Student"}</span>
                            <span className="text-[10px] text-slate-500">Left / Reconnecting</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSidebar === "CHAT" && (
                <div className="h-full flex flex-col justify-between">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No messages yet.</p>
                    ) : (
                      messages.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-[10px] font-medium text-slate-400">{m.sender}</span>
                            <span className="text-[9px] text-slate-600">{m.time}</span>
                          </div>
                          <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${m.isSelf ? "bg-blue-600 text-white" : "bg-white/10 text-slate-100"}`}>
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
                    <button type="submit" className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 cursor-pointer">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {activeSidebar === "INFO" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Topic</p>
                    <p className="text-sm font-semibold text-white">{classData?.title || classData?.topic}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{classData?.description || "Interactive problem solving session."}</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="space-y-2.5">
                    {[
                      ["Schedule", `${classData?.startTime} – ${classData?.endTime}`],
                      ["Grade", classData?.classLevel || "—"],
                      ["Faculty", classData?.teacher?.name || "—"],
                      ["Attendance", "≥ 75% required"],
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
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono min-w-[80px]">
          <span>{fmt(durationSeconds)}</span>
          <span>·</span>
          <span className="truncate max-w-[100px]">{classData?.subject}</span>
        </div>

        <div className="flex items-center gap-2.5 mx-auto">
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            }`}
            title={isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {isMicOn ? <Mic className="w-[18px] h-[18px]" /> : <MicOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isCameraOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={toggleHandRaise}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isHandRaised ? "bg-amber-500 text-black" : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="w-[18px] h-[18px]" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowReactionsPicker(!showReactionsPicker)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showReactionsPicker ? "bg-amber-500 text-black" : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
              title="React with emoji"
            >
              <Smile className="w-[18px] h-[18px]" />
            </button>

            {showReactionsPicker && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-white/20 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2 shadow-2xl z-50 animate-in fade-in zoom-in-90 duration-150">
                {["👏", "❤️", "👍", "😂", "🎉", "🔥"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setShowReactionsPicker(false);
                    }}
                    className="text-xl hover:scale-125 active:scale-95 transition-transform p-1 cursor-pointer"
                    title={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

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
