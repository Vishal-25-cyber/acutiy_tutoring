"use client";

import React, { useState } from "react";
import { Bot, Send, Sparkles, BookOpen, User, HelpCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function StudentAiTutorPage() {
  const [messages, setMessages] = useState<
    { sender: "USER" | "AI"; text: string; time: string }[]
  >([
    {
      sender: "AI",
      text: "Hello Aravind! 👋 I am your Acuity AI Study Buddy, strictly customized for your Class 10 curriculum (CBSE & State Board). What topic would you like me to explain today? You can ask about Quadratic Equations, Light Ray Diagrams, Photosynthesis, or Laws of Motion.",
      time: "Just now",
    },
  ]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAskQuestion = async (textToSend?: string) => {
    const question = textToSend || query;
    if (!question.trim()) return;

    const userMsg = {
      sender: "USER" as const,
      text: question.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/student/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question }),
      });

      const data = await res.json();
      const aiMsg = {
        sender: "AI" as const,
        text: data.answer || "I'm ready to help! Please check the Learning Hub notes for more exercises.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Explain photosynthesis in simple words.",
    "What is Pythagoras Theorem with an example?",
    "Explain Newton's Laws of Motion.",
    "How to find the discriminant of a quadratic equation?",
  ];

  return (
    <main className="p-6 sm:p-8 space-y-6 max-w-4xl flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              AI Study Buddy
            </h1>
            <Badge variant="default">Class 10 Scope</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Context-aware pedagogical assistant aligned with CBSE / State Board curriculum.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safe Educational Guardrails</span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleAskQuestion(p)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 whitespace-nowrap transition-colors"
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="flex-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.sender === "USER" ? "justify-end" : "justify-start"
            }`}
          >
            {m.sender === "AI" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-indigo-500/20">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl max-w-xl whitespace-pre-wrap ${
                m.sender === "USER"
                  ? "bg-indigo-600 text-white font-medium rounded-tr-none shadow-md shadow-indigo-500/20"
                  : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-tl-none"
              }`}
            >
              <p>{m.text}</p>
              <span
                className={`block text-[10px] mt-1.5 ${
                  m.sender === "USER" ? "text-indigo-200 text-right" : "text-slate-400"
                }`}
              >
                {m.time}
              </span>
            </div>

            {m.sender === "USER" && (
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
                AS
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-semibold text-indigo-500 pl-1">
                Analyzing Class 10 Syllabus...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question about your Class 10 subjects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
        <Button type="submit" variant="primary" size="lg" className="rounded-2xl px-6 font-bold" isLoading={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </main>
  );
}
