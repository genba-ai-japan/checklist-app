"use client";

import { useState, useEffect } from "react";
import HomeScreen from "@/components/screens/HomeScreen";
import AssetsScreen from "@/components/screens/AssetsScreen";
import CalendarScreen from "@/components/screens/CalendarScreen";
import AnalyticsScreen from "@/components/screens/AnalyticsScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import GuideScreen from "@/components/screens/GuideScreen";
import BottomNav from "@/components/layout/BottomNav";
import TransactionForm from "@/components/forms/TransactionForm";
import { isInitialized } from "@/lib/storage";
import { initSampleData } from "@/lib/sampleData";

export type TabName = "home" | "assets" | "calendar" | "analytics" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isInitialized()) {
      initSampleData();
    }
  }, []);

  function onSaved() {
    setShowForm(false);
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="flex flex-col bg-[#f2f2f7] max-w-md mx-auto relative" style={{ height: "100dvh" }}>
      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}>
        {activeTab === "home" && (
          <HomeScreen key={refreshKey} onAddPress={() => setShowForm(true)} />
        )}
        {activeTab === "assets" && <AssetsScreen key={refreshKey} />}
        {activeTab === "calendar" && (
          <CalendarScreen key={refreshKey} onAddPress={() => setShowForm(true)} />
        )}
        {activeTab === "analytics" && <AnalyticsScreen key={refreshKey} />}
        {activeTab === "settings" && (
          <SettingsScreen key={refreshKey} onDataChange={() => setRefreshKey(k => k + 1)} onShowGuide={() => setShowGuide(true)} />
        )}
      </div>

      {/* ボトムナビ */}
      <BottomNav active={activeTab} onChange={setActiveTab} onAddPress={() => setShowForm(true)} />

      {/* 収支入力フォーム（モーダル） */}
      {showForm && (
        <TransactionForm onClose={() => setShowForm(false)} onSaved={onSaved} />
      )}

      {/* 使い方ガイド */}
      {showGuide && <GuideScreen onClose={() => setShowGuide(false)} />}
    </div>
  );
}
