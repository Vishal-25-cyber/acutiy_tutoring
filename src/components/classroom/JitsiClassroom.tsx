"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Clock,
  PhoneOff,
  AlertCircle,
  Info,
  Hand,
  MonitorUp,
  MessageSquare,
  Send,
  Volume2,
  User,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function JitsiClassroom({
  classId,
  currentUserRole = "STUDENT",
  currentUserName = "Student",
  currentUserId = "",
}: JitsiClassroomProps) {
  const router = useRouter();

  const [stage, setStage] = useState<"LOADING" | "WAITING_ROOM" | "LIVE_CLASS" | "ERROR">("LOADING");
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [classData, setClassData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ id: string; name: string; email?: string; role: string; isTeacher: boolean }>({
    id: currentUserId,
    name: currentUserName,
    role: currentUserRole,
    isTeacher: currentUserRole === "TEACHER" || currentUserRole === "ADMIN",
  });

  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<"NONE" | "CHAT" | "PEOPLE" | "INFO">("NONE");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isJoining, setIsJoining] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "Dr. Sarah Jenkins",
      role: "TEACHER",
      text: "Welcome to today's Science Live Lecture on Ray Diagrams. Please keep your worksheets ready!",
      time: "19:00",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const prejoinVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch class data
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
        if (data.user) setUserInfo(data.user);
        if (data.user.role === "TEACHER" || data.user.role === "ADMIN") {
          setIsAdmitted(true);
          setStage("LIVE_CLASS");
          recordAttendanceJoin(data.class.id || classId);
        } else {
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
    return () => { mounted = false; };
  }, [classId]);

  // 2. Camera stream
  useEffect(() => {
    let active = true;
    async function setup() {
      if (!isCameraOn) {
        localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = false));
        return;
      }
      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: true,
          });
          if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
          localStreamRef.current = stream;
          stream.getAudioTracks().forEach((t) => (t.enabled = isMicOn));
        } else {
          localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = true));
        }
        if (stage === "WAITING_ROOM" && prejoinVideoRef.current) {
          prejoinVideoRef.current.srcObject = localStreamRef.current;
        } else if (stage === "LIVE_CLASS" && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch (err) {
        console.warn("Camera/mic not available:", err);
      }
    }
    setup();
    return () => { active = false; };
  }, [isCameraOn, stage]);

  useEffect(() => {
    if (stage === "LIVE_CLASS" && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [stage]);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = isMicOn; });
  }, [isMicOn]);

  // 3. Join / Admit
  const askToJoin = () => {
    setIsJoining(true);
    setTimeout(() => {
      setIsAdmitted(true);
      setStage("LIVE_CLASS");
      setIsJoining(false);
      recordAttendanceJoin(classData?.id || classId);
    }, 1800);
  };

  const recordAttendanceJoin = async (id: string) => {
    try {
      await fetch("/api/attendance/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: id }),
      });
    } catch (e) { console.warn(e); }
  };

  // 4. Timer
  useEffect(() => {
    if (stage !== "LIVE_CLASS") return;
    const timer = setInterval(() => setDurationSeconds((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [stage]);

  // 5. Heartbeat
  useEffect(() => {
    if (stage !== "LIVE_CLASS" || userInfo.role !== "STUDENT") return;
    const interval = setInterval(() => {
      fetch("/api/attendance/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      }).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [stage, classId, userInfo.role]);

  // 6. Screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => { setIsScreenSharing(false); screenStreamRef.current = null; };
      } catch (e) { console.warn("Screen share cancelled:", e); }
    }
  };

  // 7. Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}`,
      sender: userInfo.name || "Student",
      role: userInfo.role,
      text: newMessage.trim(),
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      isSelf: true,
    }]);
    setNewMessage("");
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // 8. Leave
  const handleLeaveClass = async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (userInfo.role === "STUDENT") {
      try {
        await fetch("/api/attendance/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, durationMinutes: Math.max(1, Math.round(durationSeconds / 60)) }),
        });
      } catch (e) { console.warn(e); }
    }
    router.push(userInfo.role === "TEACHER" ? "/teacher/schedule" : "/student/classes");
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // ─── LOADING ───
  if (stage === "LOADING") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Connecting to classroom...</p>
          <p className="text-xs text-slate-500">Verifying credentials and initializing media</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (stage === "ERROR") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white p-6">
        <div className="max-w-sm w-full p-6 rounded-lg bg-[#282828] border border-slate-700 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-rose-300">Cannot Enter Classroom</h2>
            <p className="text-xs text-slate-400">{errorMessage}</p>
          </div>
          <button
            onClick={() => router.push(userInfo.role === "TEACHER" ? "/teacher/schedule" : "/student/classes")}
            className="w-full py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── WAITING ROOM (Pre-Join) ───
  if (stage === "WAITING_ROOM") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col font-sans">
        {/* Top bar */}
        <header className="h-14 px-6 flex items-center border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Video className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              {classData?.title || `${classData?.subject} Live Class`}
            </span>
          </div>
        </header>

        {/* Center content */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-5 gap-10 items-center">
            {/* Camera preview (3 cols) */}
            <div className="md:col-span-3">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#282828] border border-slate-700">
                {isCameraOn ? (
                  <video
                    ref={prejoinVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#3c4043] flex items-center justify-center text-xl font-semibold text-slate-300">
                      {initials(userInfo.name)}
                    </div>
                    <span className="text-xs text-slate-500">Camera is off</span>
                  </div>
                )}

                {/* Bottom media controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isMicOn ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
                    }`}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isCameraOn ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
                    }`}
                  >
                    {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 text-center">
                Check your audio and video before joining
              </p>
            </div>

            {/* Join panel (2 cols) */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold text-white">Ready to join?</h2>
                <p className="text-xs text-slate-400">
                  {classData?.teacher?.name || "Teacher"} is hosting · {classData?.subject || "Subject"}
                </p>
              </div>

              <div className="p-3 rounded-md bg-[#282828] border border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-400">Class in progress</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  You will enter the live session immediately after clicking join.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={askToJoin}
                  disabled={isJoining}
                  className="w-full py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Join now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push("/student/classes")}
                  className="w-full py-2 rounded-full text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIVE CLASSROOM ───
  return (
    <div className="h-screen w-screen bg-[#1a1a1a] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Top Bar */}
      <header className="h-12 px-4 sm:px-5 bg-[#1a1a1a] border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <Video className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-300 truncate">
            {classData?.subject} — {classData?.title || classData?.topic}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{fmt(durationSeconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium">Recording</span>
          </div>
        </div>
      </header>

      {/* Main: Video Grid + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-3 flex gap-3 overflow-hidden">
          {/* Teacher tile */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-[#282828] border border-slate-700/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-20 h-20 rounded-full bg-[#3c4043] flex items-center justify-center text-2xl font-medium text-slate-300">
                {initials(classData?.teacher?.name || "SJ")}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-white">{classData?.teacher?.name || "Dr. Sarah Jenkins"}</p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>Presenting</span>
                </div>
              </div>
            </div>
            {/* Name label */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-[11px] font-medium text-white flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>{classData?.teacher?.name || "Dr. Sarah Jenkins"}</span>
            </div>
          </div>

          {/* Student (self) tile */}
          <div className="flex-1 relative rounded-lg overflow-hidden bg-[#282828] border border-slate-700/50 flex items-center justify-center">
            {isCameraOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-[#3c4043] flex items-center justify-center text-xl font-medium text-slate-300">
                  {initials(userInfo.name)}
                </div>
                <span className="text-xs text-slate-500">{userInfo.name}</span>
              </div>
            )}

            {/* Name label */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-[11px] font-medium text-white flex items-center gap-1.5">
              {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
              <span>{userInfo.name} (You)</span>
            </div>

            {isHandRaised && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-amber-500 text-[10px] font-semibold text-black flex items-center gap-1">
                <Hand className="w-3 h-3" />
                Raised
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {activeSidebar !== "NONE" && (
          <aside className="w-80 h-full bg-[#282828] border-l border-slate-700 flex flex-col shrink-0">
            <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="text-sm font-medium text-white">
                {activeSidebar === "CHAT" && "In-call messages"}
                {activeSidebar === "PEOPLE" && "People"}
                {activeSidebar === "INFO" && "Meeting details"}
              </h3>
              <button
                onClick={() => setActiveSidebar("NONE")}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeSidebar === "CHAT" && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {messages.map((m) => (
                      <div key={m.id} className={`space-y-0.5 ${m.isSelf ? "text-right" : ""}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500" style={{ justifyContent: m.isSelf ? "flex-end" : "flex-start" }}>
                          <span className="font-medium text-slate-400">{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <div className={`inline-block px-3 py-2 rounded-lg text-xs text-white leading-relaxed max-w-[85%] ${
                          m.isSelf ? "bg-[#1a73e8]" : "bg-[#3c4043]"
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="pt-3 flex gap-2 border-t border-slate-700 mt-3">
                    <input
                      type="text"
                      placeholder="Send a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-[#1a1a1a] border border-slate-700 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1a73e8] placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-md bg-[#1a73e8] hover:bg-[#1765cc] text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {activeSidebar === "PEOPLE" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide mb-2">In this call (2)</p>
                  <div className="p-2.5 rounded-md bg-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#3c4043] flex items-center justify-center text-[10px] font-medium text-slate-300">
                        {initials(classData?.teacher?.name || "SJ")}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{classData?.teacher?.name || "Dr. Sarah Jenkins"}</p>
                        <p className="text-[10px] text-slate-500">Host</p>
                      </div>
                    </div>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="p-2.5 rounded-md bg-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#3c4043] flex items-center justify-center text-[10px] font-medium text-slate-300">
                        {initials(userInfo.name)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{userInfo.name} (You)</p>
                        <p className="text-[10px] text-slate-500">Student</p>
                      </div>
                    </div>
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                </div>
              )}

              {activeSidebar === "INFO" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Topic</p>
                    <p className="text-sm font-medium text-white">{classData?.title}</p>
                    <p className="text-xs text-slate-400">{classData?.description || "Interactive problem solving session."}</p>
                  </div>
                  <div className="h-px bg-slate-700" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Schedule</span>
                      <span className="text-white font-mono">{classData?.startTime} – {classData?.endTime}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Grade</span>
                      <span className="text-white">Class 10 CBSE</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Faculty</span>
                      <span className="text-white">{classData?.teacher?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Attendance</span>
                      <span className="text-emerald-400 font-medium">≥ 75% required</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Controls */}
      <footer className="h-16 bg-[#1a1a1a] border-t border-slate-800 flex items-center justify-between px-5 shrink-0 z-20">
        {/* Left: Meeting info */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>{fmt(durationSeconds)}</span>
          <span>·</span>
          <span>{classData?.subject}</span>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-2 mx-auto">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isMicOn ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
            }`}
            title={isMicOn ? "Turn off mic" : "Turn on mic"}
          >
            {isMicOn ? <Mic className="w-[18px] h-[18px]" /> : <MicOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isCameraOn ? "bg-[#3c4043] hover:bg-[#4a4e51] text-white" : "bg-[#ea4335] hover:bg-[#d33426] text-white"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />}
          </button>

          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isHandRaised ? "bg-amber-500 text-black" : "bg-[#3c4043] hover:bg-[#4a4e51] text-white"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={toggleScreenShare}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isScreenSharing ? "bg-[#1a73e8] text-white" : "bg-[#3c4043] hover:bg-[#4a4e51] text-white"
            }`}
            title="Share screen"
          >
            <MonitorUp className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={handleLeaveClass}
            className="h-10 px-5 rounded-full bg-[#ea4335] hover:bg-[#d33426] text-white text-xs font-medium flex items-center gap-2 ml-2 cursor-pointer"
            title="Leave call"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right: Sidebar toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSidebar(activeSidebar === "INFO" ? "NONE" : "INFO")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === "INFO" ? "bg-[#3c4043] text-white" : "hover:bg-[#3c4043] text-slate-400"
            }`}
          >
            <Info className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => setActiveSidebar(activeSidebar === "PEOPLE" ? "NONE" : "PEOPLE")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === "PEOPLE" ? "bg-[#3c4043] text-white" : "hover:bg-[#3c4043] text-slate-400"
            }`}
          >
            <Users className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => setActiveSidebar(activeSidebar === "CHAT" ? "NONE" : "CHAT")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === "CHAT" ? "bg-[#3c4043] text-white" : "hover:bg-[#3c4043] text-slate-400"
            }`}
          >
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>
        </div>
      </footer>
    </div>
  );
}
