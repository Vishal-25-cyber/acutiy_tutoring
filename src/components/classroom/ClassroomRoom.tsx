"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  MessageSquare,
  Users,
  Hand,
  Settings,
  PhoneOff,
  Sparkles,
  Signal,
  CheckCircle2,
  ShieldAlert,
  Send,
  HelpCircle,
  Clock,
  Award,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface ClassroomRoomProps {
  sessionId: string;
  initialSessionData?: any;
  currentUserRole: "STUDENT" | "TEACHER" | "ADMIN";
  currentUserName: string;
  currentUserId: string;
}

export function ClassroomRoom({
  sessionId,
  initialSessionData,
  currentUserRole,
  currentUserName,
  currentUserId,
}: ClassroomRoomProps) {
  const router = useRouter();
  const [session, setSession] = useState<any>(initialSessionData || null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<"NONE" | "CHAT" | "PARTICIPANTS" | "POLL">("NONE");
  const [connectionQuality, setConnectionQuality] = useState<"EXCELLENT" | "GOOD" | "POOR">("EXCELLENT");

  // Timer & Attendance
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isEntryClosed, setIsEntryClosed] = useState(false);
  const [entryClosedReason, setEntryClosedReason] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; role: string; text: string; time: string }[]
  >([
    {
      id: "1",
      sender: "System",
      role: "SYSTEM",
      text: "Welcome to the live interactive classroom! Please keep your audio muted when the teacher is explaining.",
      time: "Now",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Classroom Poll
  const [poll, setPoll] = useState<any>(initialSessionData?.activePoll || null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const teacherName = initialSessionData?.teacherId?.name || "Assigned Faculty Specialist";

  // Teacher Controls State
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [participants, setParticipants] = useState<
    { id: string; name: string; role: string; isMuted: boolean; isVideoOff: boolean; isHandRaised: boolean }[]
  >([
    { id: "teacher-1", name: teacherName, role: "TEACHER", isMuted: false, isVideoOff: false, isHandRaised: false },
    { id: currentUserId, name: currentUserName, role: currentUserRole, isMuted: !isMicOn, isVideoOff: !isVideoOn, isHandRaised: false },
  ]);

  // Fetch token & validate entry
  useEffect(() => {
    async function initRoom() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.error === "ENTRY_CLOSED") {
            setIsEntryClosed(true);
            setEntryClosedReason(data.message || "Class entry is closed after the 5-minute grace period.");
          } else {
            alert(data.error || "Failed to enter class");
            router.push(currentUserRole === "STUDENT" ? "/student/classes" : "/teacher/dashboard");
          }
          return;
        }

        if (data.session) {
          setSession(data.session);
          if (data.session.activePoll) {
            setPoll(data.session.activePoll);
          }
        }
      } catch (err) {
        console.error("Room init error:", err);
      }
    }

    initRoom();
  }, [sessionId, currentUserRole, router]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Leave Class handler & Attendance log
  const handleLeaveClass = async () => {
    try {
      if (currentUserRole === "STUDENT") {
        await fetch("/api/livekit/record-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
          }),
        });
      }
    } catch (e) {
      console.error(e);
    }

    if (currentUserRole === "STUDENT") {
      router.push("/student/dashboard");
    } else if (currentUserRole === "TEACHER") {
      router.push("/teacher/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: currentUserName,
      role: currentUserRole,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  // Vote on Poll
  const handleVote = async (optionIdx: number) => {
    setSelectedOption(optionIdx);
    setHasVoted(true);

    try {
      const res = await fetch("/api/livekit/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VOTE",
          sessionId,
          optionIndex: optionIdx,
        }),
      });
      const data = await res.json();
      if (data.poll) setPoll(data.poll);
    } catch (err) {
      console.error(err);
    }
  };

  // Teacher End Class
  const handleTeacherEndClass = async () => {
    if (!confirm("Are you sure you want to end this live class for all students?")) return;
    try {
      await fetch("/api/teacher/live-session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "END_CLASS" }),
      });
    } catch (err) {
      console.error(err);
    }
    router.push("/teacher/dashboard");
  };

  if (isEntryClosed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <Badge variant="destructive" className="mb-3">
            ENTRY CLOSED
          </Badge>
          <h2 className="text-2xl font-bold mb-2">Class Access Locked</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {entryClosedReason ||
              "The 5-minute late entry grace period for this batch has expired. Regular attendance ensures uninterrupted learning."}
          </p>
          <div className="bg-slate-800/60 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-2 mb-6 border border-slate-700/50">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Class notes and PDF worksheets will be available in the Learning Hub.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              Recorded session replay will be published upon class completion.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push("/student/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top Classroom Bar */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-slate-700 shadow-sm flex items-center justify-center shrink-0">
            <img src="/images/mantif_logo.png" alt="Mantif" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">
                {session?.title || "Class 10 Mathematics Live Masterclass"}
              </span>
              <Badge variant="live" className="text-[10px] uppercase">
                LIVE
              </Badge>
              {isRoomLocked && (
                <Badge variant="warning" className="text-[10px]">
                  Room Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Topic: {session?.topic || "Quadratic Equations & Roots"} • {session?.classLevel || "Class 10"}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-medium text-slate-200">{formatTime(durationSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
            <Signal
              className={`w-3.5 h-3.5 ${
                connectionQuality === "EXCELLENT"
                  ? "text-emerald-400"
                  : connectionQuality === "GOOD"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            />
            <span className="text-slate-300 hidden md:inline">HD Quality</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
              {currentUserName[0] || "U"}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUserName}</p>
              <p className="text-[10px] text-indigo-400 uppercase font-medium">{currentUserRole}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Classroom Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            {/* Primary Spotlight Screen (Teacher / Screen Share) */}
            <div className="lg:col-span-3 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
              {/* Simulated HD Live Stream */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-center">
                {/* Classroom Blackboard / Video Simulation */}
                <div className="text-center p-8 max-w-xl">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black shadow-xl shadow-indigo-500/30">
                    {(teacherName || "FC").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">{teacherName}</h3>
                  <p className="text-sm text-indigo-400 font-medium mt-1">Live Online Classroom • Mantif Tutoring</p>

                  <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Primary Speaker Stream Active • Echo Cancellation Enabled</span>
                  </div>
                </div>
              </div>

              {/* Watermark Tag */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {teacherName} (Teacher)
                </div>
                <div className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-slate-300">
                  1080p 60fps
                </div>
              </div>

              {/* Active Speaker Animation border */}
              <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-3xl pointer-events-none" />
            </div>

            {/* Side Participants Video Strip (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3 overflow-y-auto pr-1">
              {participants.slice(1, 5).map((p) => (
                <div
                  key={p.id}
                  className="h-32 rounded-2xl bg-slate-900 border border-slate-800 relative flex items-center justify-center overflow-hidden group hover:border-slate-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm">
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                    <span className="truncate max-w-[90px] text-slate-200">{p.name}</span>
                    {p.isMuted ? (
                      <MicOff className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  {p.isHandRaised && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-full animate-bounce">
                      <Hand className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Side Drawers (Chat / Participants / Poll) */}
        {activeTab !== "NONE" && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0 z-30 transition-all duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeTab === "CHAT" && (
                  <>
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-sm">Classroom Chat</h4>
                  </>
                )}
                {activeTab === "PARTICIPANTS" && (
                  <>
                    <Users className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-sm">Participants ({participants.length})</h4>
                  </>
                )}
                {activeTab === "POLL" && (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-sm">Live Quiz & Poll</h4>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveTab("NONE")}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* CHAT DRAWER */}
            {activeTab === "CHAT" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl text-xs ${
                        msg.role === "SYSTEM"
                          ? "bg-slate-800/80 border border-slate-700/60 text-slate-300 italic"
                          : msg.sender === currentUserName
                          ? "bg-indigo-600/30 border border-indigo-500/40 text-slate-100 ml-4"
                          : "bg-slate-800/50 border border-slate-700/40 text-slate-200 mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-indigo-300">{msg.sender}</span>
                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask teacher a question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" size="sm" variant="default" className="rounded-xl">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            )}

            {/* PARTICIPANTS DRAWER */}
            {activeTab === "PARTICIPANTS" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {currentUserRole === "TEACHER" && (
                  <div className="mb-4 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Teacher Quick Host Controls
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-8"
                        onClick={() => {
                          setParticipants((prev) =>
                            prev.map((p) => (p.role !== "TEACHER" ? { ...p, isMuted: true } : p))
                          );
                        }}
                      >
                        <VolumeX className="w-3 h-3 mr-1" /> Mute All
                      </Button>
                      <Button
                        size="sm"
                        variant={isRoomLocked ? "destructive" : "secondary"}
                        className="text-xs h-8"
                        onClick={() => setIsRoomLocked(!isRoomLocked)}
                      >
                        {isRoomLocked ? "Unlock Room" : "Lock Room"}
                      </Button>
                    </div>
                  </div>
                )}

                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-200 leading-tight">
                          {p.name} {p.id === currentUserId && "(You)"}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase">{p.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.isHandRaised && <Hand className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                      {p.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* POLL / QUIZ DRAWER */}
            {activeTab === "POLL" && (
              <div className="flex-1 p-4 overflow-y-auto">
                {poll ? (
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                    <Badge variant="warning" className="mb-2">
                      Live Concept Quiz
                    </Badge>
                    <h5 className="font-bold text-sm text-slate-100 mb-4">{poll.question}</h5>

                    <div className="space-y-2 mb-4">
                      {poll.options.map((opt: any, idx: number) => {
                        const totalVotes = poll.options.reduce((acc: number, curr: any) => acc + curr.votes, 0) || 1;
                        const pct = Math.round((opt.votes / totalVotes) * 100);

                        return (
                          <button
                            key={idx}
                            disabled={hasVoted}
                            onClick={() => handleVote(idx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all relative overflow-hidden ${
                              selectedOption === idx
                                ? "border-indigo-500 bg-indigo-600/30 text-white font-semibold"
                                : "border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200"
                            }`}
                          >
                            {/* Vote percentage bar */}
                            {hasVoted && (
                              <div
                                className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                            <div className="relative flex items-center justify-between">
                              <span>{opt.text}</span>
                              {hasVoted && <span className="font-bold text-indigo-300">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {hasVoted && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Your response has been recorded!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No active poll right now. The teacher will launch quick checks during class.
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Classroom Control Toolbar */}
      <footer className="h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        {/* Left Info */}
        <div className="hidden sm:flex items-center gap-3">
          <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
            Batch: {session?.startTime || "7:00 PM"} – {session?.endTime || "8:00 PM"}
          </Badge>
        </div>

        {/* Center Main Controls */}
        <div className="flex items-center gap-3 mx-auto">
          {/* Microphone */}
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isMicOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
            }`}
            title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share (Teacher / Student) */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Share Screen"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Raise Hand (Student) */}
          {currentUserRole === "STUDENT" && (
            <button
              onClick={() => setIsHandRaised(!isHandRaised)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isHandRaised
                  ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title="Raise Hand"
            >
              <Hand className="w-5 h-5" />
            </button>
          )}

          {/* Chat Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "CHAT" ? "NONE" : "CHAT")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${
              activeTab === "CHAT" ? "bg-indigo-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Classroom Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-400" />
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "PARTICIPANTS" ? "NONE" : "PARTICIPANTS")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "PARTICIPANTS"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Participants List"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Poll / Quiz Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "POLL" ? "NONE" : "POLL")}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === "POLL"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
            title="Live Polls & Quizzes"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Right Exit / End Class Controls */}
        <div className="flex items-center gap-3">
          {currentUserRole === "TEACHER" && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl hidden sm:inline-flex"
              onClick={handleTeacherEndClass}
            >
              End Class for All
            </Button>
          )}

          <button
            onClick={handleLeaveClass}
            className="h-11 px-4 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Class</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
