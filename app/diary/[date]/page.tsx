"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDiaryEntry, saveDiaryEntry } from "@/lib/storage";
import type { DiaryAnswer } from "@/types";

// ── 質問リスト ─────────────────────────────────────────────
const QUESTIONS = [
  "今日はどんな1日でしたか？",
  "今日、一番嬉しかったこと・良かったことは何ですか？",
  "今日、難しかったことや反省していることはありますか？",
  "今日、感謝したいことを教えてください。",
  "明日、やりたいことや楽しみにしていることは何ですか？",
];

// ── フォローアップ質問 (各回答後にランダム表示) ─────────────
const FOLLOWUPS: Record<number, string[]> = {
  0: ["もう少し詳しく教えてもらえますか？", "それはなぜそう感じましたか？"],
  1: ["それはどんな気持ちでしたか？", "誰かと共有しましたか？"],
  2: ["次はどう対処しますか？", "同じ状況になったらどうしますか？"],
  3: ["その感謝、相手に伝えましたか？"],
  4: ["それを達成するために何か準備することはありますか？"],
};

type Mode = "qa" | "view";

export default function DiarySessionPage() {
  const { date } = useParams<{ date: string }>();
  const [mode, setMode] = useState<Mode>("qa");
  const [answers, setAnswers] = useState<DiaryAnswer[]>([]);
  const [step, setStep] = useState(0); // 現在の質問インデックス
  const [input, setInput] = useState("");
  const [followupText, setFollowupText] = useState<string | null>(null);
  const [awaitingFollowup, setAwaitingFollowup] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  useEffect(() => {
    const existing = getDiaryEntry(date);
    if (existing && existing.answers.length > 0) {
      setAnswers(existing.answers);
      setMode("view");
      setSaved(true);
    }
  }, [date]);

  // スクロールを最下部に
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    textareaRef.current?.focus();
  }, [step, awaitingFollowup, answers.length]);

  const currentQuestion = awaitingFollowup
    ? followupText ?? ""
    : QUESTIONS[step] ?? "";

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;

    if (awaitingFollowup && followupText) {
      // フォローアップへの回答を追加
      const updated = [
        ...answers,
        { question: followupText, answer: text },
      ];
      setAnswers(updated);
      setInput("");
      setAwaitingFollowup(false);
      setFollowupText(null);
      // 次の質問へ
      proceedToNext(updated);
    } else {
      // メイン質問への回答
      const updated = [
        ...answers,
        { question: QUESTIONS[step], answer: text },
      ];
      setAnswers(updated);
      setInput("");

      // フォローアップを出すか判定（50%の確率）
      const followups = FOLLOWUPS[step];
      if (followups && Math.random() < 0.5) {
        const fq = followups[Math.floor(Math.random() * followups.length)];
        setFollowupText(fq);
        setAwaitingFollowup(true);
      } else {
        proceedToNext(updated);
      }
    }
  };

  const proceedToNext = (currentAnswers: DiaryAnswer[]) => {
    const nextStep = step + 1;
    if (nextStep >= QUESTIONS.length) {
      // 全質問完了 → 保存
      saveDiaryEntry(date, currentAnswers);
      setSaved(true);
      setMode("view");
    } else {
      setStep(nextStep);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startOver = () => {
    setAnswers([]);
    setStep(0);
    setInput("");
    setAwaitingFollowup(false);
    setFollowupText(null);
    setSaved(false);
    setMode("qa");
  };

  // ── 完了 or 閲覧モード ────────────────────────────────────
  if (mode === "view") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href="/diary" className="text-rose-500 text-lg p-1">‹</Link>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900">📔 {dateLabel}</h1>
              <p className="text-xs text-gray-400">{answers.length}問 回答済み</p>
            </div>
            <button
              onClick={startOver}
              className="text-xs text-rose-500 border border-rose-200 px-3 py-1.5 rounded-full"
            >
              書き直す
            </button>
          </div>
        </header>

        <main className="px-4 py-5 pb-16 space-y-4">
          {answers.map((a, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-rose-400 mb-2">Q. {a.question}</p>
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{a.answer}</p>
            </div>
          ))}

          {saved && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">保存済み ✓</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Q&A モード ────────────────────────────────────────────
  const progress = ((step + (awaitingFollowup ? 0.5 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/diary" className="text-rose-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">📔 {dateLabel}</h1>
            <p className="text-xs text-gray-400">
              {awaitingFollowup ? `質問 ${step + 1}` : `質問 ${step + 1} / ${QUESTIONS.length}`}
            </p>
          </div>
        </div>
        {/* 進捗バー */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-rose-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* 会話ログ */}
      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-52">
        {/* 過去の回答 */}
        {answers.map((a, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3">
                <p className="text-xs text-rose-400 font-bold mb-1">📔</p>
                <p className="text-gray-800 text-sm leading-relaxed">{a.question}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-rose-500 rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{a.answer}</p>
              </div>
            </div>
          </div>
        ))}

        {/* 現在の質問 */}
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-rose-400 font-bold mb-1">
              {awaitingFollowup ? "📔 もう少し聞かせてください" : "📔"}
            </p>
            <p className="text-gray-800 text-sm leading-relaxed">{currentQuestion}</p>
          </div>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* 入力エリア（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 space-y-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // 高さ自動調整
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="ここに入力... (Enterで送信)"
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
          style={{ minHeight: "52px", maxHeight: "120px" }}
        />
        <div className="flex gap-2">
          {awaitingFollowup && (
            <button
              onClick={() => {
                setAwaitingFollowup(false);
                setFollowupText(null);
                proceedToNext(answers);
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
            >
              スキップ
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-rose-700"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
