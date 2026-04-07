"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadMindNodes, saveMindNodes } from "@/lib/dashboard-storage";
import { MindNode } from "@/types";

// ─── レイアウト定数 ────────────────────────────────────────────────────────────
const NW = 140;
const NH = 40;
const HGAP = 72;
const VSLOT = 56;

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1"];

// ─── フレームワーク定義 ────────────────────────────────────────────────────────
type TplNode = { key: string; text: string; parentKey: string | null; color: string };

function buildNodes(tpl: TplNode[]): MindNode[] {
  const keyToId = new Map<string, string>();
  tpl.forEach((t) => keyToId.set(t.key, crypto.randomUUID()));
  return tpl.map((t) => ({
    id: keyToId.get(t.key)!,
    text: t.text,
    parentId: t.parentKey ? keyToId.get(t.parentKey)! : null,
    color: t.color,
  }));
}

interface Framework {
  id: string; name: string; description: string; icon: string; accent: string;
  build: (topic: string) => MindNode[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: "mece", name: "MECE", description: "抜け漏れなく・ダブりなく分類する", icon: "🔲", accent: "#3b82f6",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#1d4ed8" },
      { key:"a", text:"カテゴリA", parentKey:"r", color:"#3b82f6" },
      { key:"a1", text:"項目を入力", parentKey:"a", color:"#60a5fa" },
      { key:"a2", text:"項目を入力", parentKey:"a", color:"#60a5fa" },
      { key:"b", text:"カテゴリB", parentKey:"r", color:"#10b981" },
      { key:"b1", text:"項目を入力", parentKey:"b", color:"#34d399" },
      { key:"b2", text:"項目を入力", parentKey:"b", color:"#34d399" },
      { key:"c", text:"カテゴリC", parentKey:"r", color:"#f59e0b" },
      { key:"c1", text:"項目を入力", parentKey:"c", color:"#fbbf24" },
      { key:"c2", text:"項目を入力", parentKey:"c", color:"#fbbf24" },
      { key:"d", text:"カテゴリD", parentKey:"r", color:"#ef4444" },
      { key:"d1", text:"項目を入力", parentKey:"d", color:"#f87171" },
      { key:"d2", text:"項目を入力", parentKey:"d", color:"#f87171" },
    ]),
  },
  {
    id: "swot", name: "SWOT分析", description: "強み・弱み・機会・脅威で現状把握", icon: "⚖️", accent: "#10b981",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#1d4ed8" },
      { key:"s", text:"S 強み (Strengths)", parentKey:"r", color:"#16a34a" },
      { key:"s1", text:"強みを入力", parentKey:"s", color:"#22c55e" },
      { key:"s2", text:"強みを入力", parentKey:"s", color:"#22c55e" },
      { key:"w", text:"W 弱み (Weaknesses)", parentKey:"r", color:"#dc2626" },
      { key:"w1", text:"弱みを入力", parentKey:"w", color:"#f87171" },
      { key:"w2", text:"弱みを入力", parentKey:"w", color:"#f87171" },
      { key:"o", text:"O 機会 (Opportunities)", parentKey:"r", color:"#2563eb" },
      { key:"o1", text:"機会を入力", parentKey:"o", color:"#60a5fa" },
      { key:"o2", text:"機会を入力", parentKey:"o", color:"#60a5fa" },
      { key:"th", text:"T 脅威 (Threats)", parentKey:"r", color:"#d97706" },
      { key:"t1", text:"脅威を入力", parentKey:"th", color:"#fbbf24" },
      { key:"t2", text:"脅威を入力", parentKey:"th", color:"#fbbf24" },
    ]),
  },
  {
    id: "scamper", name: "SCAMPER", description: "7つの視点でアイデアを発想する", icon: "💡", accent: "#f59e0b",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#7c3aed" },
      { key:"s", text:"S 代替（Substitute）", parentKey:"r", color:"#3b82f6" },
      { key:"s1", text:"別の材料・方法に変えると？", parentKey:"s", color:"#60a5fa" },
      { key:"c", text:"C 組合せ（Combine）", parentKey:"r", color:"#10b981" },
      { key:"c1", text:"何かと組み合わせると？", parentKey:"c", color:"#34d399" },
      { key:"a", text:"A 応用（Adapt）", parentKey:"r", color:"#f59e0b" },
      { key:"a1", text:"他から応用できる要素は？", parentKey:"a", color:"#fbbf24" },
      { key:"m", text:"M 修正・拡大（Modify）", parentKey:"r", color:"#ef4444" },
      { key:"m1", text:"変更・拡大するとどうなる？", parentKey:"m", color:"#f87171" },
      { key:"p", text:"P 転用（Put to other uses）", parentKey:"r", color:"#8b5cf6" },
      { key:"p1", text:"他の使い道・用途は？", parentKey:"p", color:"#a78bfa" },
      { key:"e", text:"E 削除（Eliminate）", parentKey:"r", color:"#ec4899" },
      { key:"e1", text:"取り除けるものは何か？", parentKey:"e", color:"#f472b6" },
      { key:"rv", text:"R 逆転（Reverse）", parentKey:"r", color:"#06b6d4" },
      { key:"r1", text:"逆にするとどうなる？", parentKey:"rv", color:"#22d3ee" },
    ]),
  },
  {
    id: "why", name: "WHYツリー", description: "なぜを繰り返して根本原因を追求", icon: "🔍", accent: "#ef4444",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#b91c1c" },
      { key:"w1", text:"なぜ？ 要因①", parentKey:"r", color:"#dc2626" },
      { key:"w11", text:"さらになぜ？", parentKey:"w1", color:"#f87171" },
      { key:"w111", text:"さらになぜ？（根本原因）", parentKey:"w11", color:"#fca5a5" },
      { key:"w12", text:"さらになぜ？", parentKey:"w1", color:"#f87171" },
      { key:"w121", text:"さらになぜ？（根本原因）", parentKey:"w12", color:"#fca5a5" },
      { key:"w2", text:"なぜ？ 要因②", parentKey:"r", color:"#dc2626" },
      { key:"w21", text:"さらになぜ？", parentKey:"w2", color:"#f87171" },
      { key:"w211", text:"さらになぜ？（根本原因）", parentKey:"w21", color:"#fca5a5" },
      { key:"w22", text:"さらになぜ？", parentKey:"w2", color:"#f87171" },
      { key:"w221", text:"さらになぜ？（根本原因）", parentKey:"w22", color:"#fca5a5" },
    ]),
  },
  {
    id: "how", name: "HOWツリー", description: "どうやってを展開して解決策を導く", icon: "🛠️", accent: "#10b981",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#15803d" },
      { key:"h1", text:"どうやって？ 手段①", parentKey:"r", color:"#16a34a" },
      { key:"h11", text:"具体的アクションを入力", parentKey:"h1", color:"#22c55e" },
      { key:"h12", text:"具体的アクションを入力", parentKey:"h1", color:"#22c55e" },
      { key:"h2", text:"どうやって？ 手段②", parentKey:"r", color:"#16a34a" },
      { key:"h21", text:"具体的アクションを入力", parentKey:"h2", color:"#22c55e" },
      { key:"h22", text:"具体的アクションを入力", parentKey:"h2", color:"#22c55e" },
      { key:"h3", text:"どうやって？ 手段③", parentKey:"r", color:"#16a34a" },
      { key:"h31", text:"具体的アクションを入力", parentKey:"h3", color:"#22c55e" },
      { key:"h32", text:"具体的アクションを入力", parentKey:"h3", color:"#22c55e" },
    ]),
  },
  {
    id: "pdca", name: "PDCA", description: "計画→実行→評価→改善のサイクル", icon: "🔄", accent: "#3b82f6",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#1d4ed8" },
      { key:"p", text:"P 計画 Plan", parentKey:"r", color:"#3b82f6" },
      { key:"p1", text:"目標・ゴール", parentKey:"p", color:"#60a5fa" },
      { key:"p2", text:"手段・方法", parentKey:"p", color:"#60a5fa" },
      { key:"p3", text:"スケジュール", parentKey:"p", color:"#60a5fa" },
      { key:"d", text:"D 実行 Do", parentKey:"r", color:"#16a34a" },
      { key:"d1", text:"実施内容", parentKey:"d", color:"#22c55e" },
      { key:"d2", text:"担当者・役割", parentKey:"d", color:"#22c55e" },
      { key:"c", text:"C 評価 Check", parentKey:"r", color:"#d97706" },
      { key:"c1", text:"達成度確認", parentKey:"c", color:"#fbbf24" },
      { key:"c2", text:"課題・問題点", parentKey:"c", color:"#fbbf24" },
      { key:"a", text:"A 改善 Act", parentKey:"r", color:"#dc2626" },
      { key:"a1", text:"改善アクション", parentKey:"a", color:"#f87171" },
      { key:"a2", text:"次のPlanへ反映", parentKey:"a", color:"#f87171" },
    ]),
  },
  {
    id: "project", name: "プロジェクトマッピング", description: "プロジェクト全体を俯瞰して整理", icon: "📋", accent: "#8b5cf6",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#7c3aed" },
      { key:"g", text:"目的・目標", parentKey:"r", color:"#8b5cf6" },
      { key:"g1", text:"達成したいゴールを入力", parentKey:"g", color:"#a78bfa" },
      { key:"st", text:"ステークホルダー", parentKey:"r", color:"#2563eb" },
      { key:"st1", text:"関係者を入力", parentKey:"st", color:"#60a5fa" },
      { key:"sc", text:"スコープ・範囲", parentKey:"r", color:"#16a34a" },
      { key:"sc1", text:"対象範囲を入力", parentKey:"sc", color:"#22c55e" },
      { key:"sk", text:"スケジュール", parentKey:"r", color:"#d97706" },
      { key:"sk1", text:"マイルストーンを入力", parentKey:"sk", color:"#fbbf24" },
      { key:"rs", text:"リスク・課題", parentKey:"r", color:"#dc2626" },
      { key:"rs1", text:"想定リスクを入力", parentKey:"rs", color:"#f87171" },
      { key:"re", text:"リソース・予算", parentKey:"r", color:"#0891b2" },
      { key:"re1", text:"必要リソースを入力", parentKey:"re", color:"#22d3ee" },
    ]),
  },
  {
    id: "system", name: "システムシンキング", description: "要素と関係性でシステム全体を把握", icon: "🕸️", accent: "#06b6d4",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#0e7490" },
      { key:"el", text:"構成要素", parentKey:"r", color:"#0891b2" },
      { key:"el1", text:"要素①を入力", parentKey:"el", color:"#22d3ee" },
      { key:"el2", text:"要素②を入力", parentKey:"el", color:"#22d3ee" },
      { key:"el3", text:"要素③を入力", parentKey:"el", color:"#22d3ee" },
      { key:"rel", text:"相互関係", parentKey:"r", color:"#7c3aed" },
      { key:"rel1", text:"強化ループ（増幅）", parentKey:"rel", color:"#8b5cf6" },
      { key:"rel2", text:"均衡ループ（安定）", parentKey:"rel", color:"#a78bfa" },
      { key:"lev", text:"レバレッジポイント", parentKey:"r", color:"#16a34a" },
      { key:"lev1", text:"変化を生む介入点を入力", parentKey:"lev", color:"#22c55e" },
      { key:"ext", text:"外部環境・制約", parentKey:"r", color:"#d97706" },
      { key:"ext1", text:"外部要因を入力", parentKey:"ext", color:"#fbbf24" },
    ]),
  },
  {
    id: "5w1h", name: "5W1H", description: "6つの問いで情報を網羅的に整理", icon: "❓", accent: "#ec4899",
    build: (t) => buildNodes([
      { key:"r", text: t, parentKey: null, color:"#be185d" },
      { key:"who", text:"Who  誰が", parentKey:"r", color:"#ec4899" },
      { key:"who1", text:"関係者・担当者を入力", parentKey:"who", color:"#f472b6" },
      { key:"what", text:"What  何を", parentKey:"r", color:"#8b5cf6" },
      { key:"what1", text:"対象・内容を入力", parentKey:"what", color:"#a78bfa" },
      { key:"when", text:"When  いつ", parentKey:"r", color:"#2563eb" },
      { key:"when1", text:"日時・期間を入力", parentKey:"when", color:"#60a5fa" },
      { key:"where", text:"Where  どこで", parentKey:"r", color:"#16a34a" },
      { key:"where1", text:"場所・範囲を入力", parentKey:"where", color:"#22c55e" },
      { key:"why", text:"Why  なぜ", parentKey:"r", color:"#dc2626" },
      { key:"why1", text:"目的・理由を入力", parentKey:"why", color:"#f87171" },
      { key:"how", text:"How  どのように", parentKey:"r", color:"#d97706" },
      { key:"how1", text:"手段・方法を入力", parentKey:"how", color:"#fbbf24" },
    ]),
  },
];

// ─── 木構造レイアウト ──────────────────────────────────────────────────────────
function subtreeSize(id: string, nodes: MindNode[]): number {
  const children = nodes.filter((n) => n.parentId === id);
  if (children.length === 0) return 1;
  return children.reduce((s, c) => s + subtreeSize(c.id, nodes), 0);
}

function layoutNodes(nodes: MindNode[]): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const root = nodes.find((n) => n.parentId === null);
  if (!root) return pos;
  function layout(id: string, level: number, startSlot: number) {
    const children = nodes.filter((n) => n.parentId === id);
    const size = subtreeSize(id, nodes);
    const center = startSlot + size / 2;
    pos.set(id, { x: level * (NW + HGAP), y: center * VSLOT - NH / 2 });
    let slot = startSlot;
    for (const child of children) {
      layout(child.id, level + 1, slot);
      slot += subtreeSize(child.id, nodes);
    }
  }
  layout(root.id, 0, 0);
  return pos;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────
export default function MindMapPage() {
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputMode, setInputMode] = useState<"add" | "edit">("add");
  const [offset, setOffset] = useState({ x: 16, y: 60 });
  const [scale, setScale] = useState(1);

  // フレームワーク選択
  const [showFwSelect, setShowFwSelect] = useState(false);
  const [pendingFw, setPendingFw] = useState<Framework | null>(null);
  const [fwTopic, setFwTopic] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const lastPinchRef = useRef<number | null>(null);

  useEffect(() => { setNodes(loadMindNodes()); }, []);

  function save(updated: MindNode[]) { setNodes(updated); saveMindNodes(updated); }

  // ─── ノード操作 ──────────────────────────────────────────────────────────────
  function openAdd() { if (!selected) return; setInputText(""); setInputMode("add"); setShowInput(true); }
  function openEdit() {
    if (!selected) return;
    const node = nodes.find((n) => n.id === selected);
    if (!node) return;
    setInputText(node.text); setInputMode("edit"); setShowInput(true);
  }

  function commitInput() {
    const text = inputText.trim();
    if (!text) { setShowInput(false); return; }
    if (inputMode === "add" && selected) {
      const depth = getDepth(selected, nodes);
      const color = COLORS[(depth + 1) % COLORS.length];
      save([...nodes, { id: crypto.randomUUID(), text, parentId: selected, color }]);
    } else if (inputMode === "edit" && selected) {
      save(nodes.map((n) => n.id === selected ? { ...n, text } : n));
    }
    setShowInput(false); setInputText("");
  }

  function deleteNode(id: string) {
    function desc(nid: string): string[] {
      const ch = nodes.filter((n) => n.parentId === nid);
      return [nid, ...ch.flatMap((c) => desc(c.id))];
    }
    const del = new Set(desc(id));
    save(nodes.filter((n) => !del.has(n.id)));
    setSelected(null);
  }

  function changeColor(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const idx = (COLORS.indexOf(node.color) + 1) % COLORS.length;
    save(nodes.map((n) => n.id === id ? { ...n, color: COLORS[idx] } : n));
  }

  function getDepth(id: string, ns: MindNode[]): number {
    let d = 0, cur = ns.find((n) => n.id === id);
    while (cur?.parentId) { d++; cur = ns.find((n) => n.id === cur!.parentId); }
    return d;
  }

  // ─── フレームワーク適用 ───────────────────────────────────────────────────────
  function selectFramework(fw: Framework) {
    setPendingFw(fw);
    setFwTopic("");
    setShowFwSelect(false);
  }

  function applyFramework() {
    if (!pendingFw) return;
    const topic = fwTopic.trim() || pendingFw.name;
    save(pendingFw.build(topic));
    setPendingFw(null);
    setFwTopic("");
    setSelected(null);
    setScale(1);
    setOffset({ x: 16, y: 60 });
  }

  // ─── パン・ズーム ─────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    setOffset({ x: dragRef.current.ox + e.clientX - dragRef.current.startX, y: dragRef.current.oy + e.clientY - dragRef.current.startY });
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (lastPinchRef.current !== null) {
      setScale((s) => Math.max(0.4, Math.min(2.5, s * (d / lastPinchRef.current!))));
    }
    lastPinchRef.current = d;
  }, []);

  const onTouchEnd = useCallback(() => { lastPinchRef.current = null; }, []);

  const pos = layoutNodes(nodes);
  const selectedNode = nodes.find((n) => n.id === selected);
  const isRoot = selectedNode?.parentId === null;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col" style={{ paddingBottom: "56px" }}>
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">🧠 マインドマップ</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">ドラッグでスクロール　ピンチでズーム</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFwSelect(true)}
            className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg active:bg-purple-100"
          >📐 フレームワーク</button>
          <button
            onClick={() => { setSelected(null); setScale(1); setOffset({ x: 16, y: 60 }); }}
            className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
          >リセット</button>
        </div>
      </header>

      {/* SVGキャンバス */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          className="w-full h-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <g transform={`translate(${offset.x},${offset.y}) scale(${scale})`}>
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const p = pos.get(node.parentId), c = pos.get(node.id);
              if (!p || !c) return null;
              return (
                <path key={`l-${node.id}`}
                  d={bezierPath(p.x + NW, p.y + NH / 2, c.x, c.y + NH / 2)}
                  fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.5}
                />
              );
            })}
            {nodes.map((node) => {
              const p = pos.get(node.id);
              if (!p) return null;
              const isSel = node.id === selected;
              return (
                <g key={node.id} data-node="true" transform={`translate(${p.x},${p.y})`}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : node.id); }}
                  style={{ cursor: "pointer" }}>
                  <rect width={NW} height={NH} rx={NH / 2} fill={node.color}
                    opacity={isSel ? 1 : 0.88}
                    stroke={isSel ? "#fff" : "transparent"} strokeWidth={isSel ? 3 : 0}
                    style={{ filter: isSel ? "drop-shadow(0 0 6px rgba(0,0,0,0.3))" : "none" }}
                  />
                  <foreignObject x={8} y={4} width={NW - 16} height={NH - 8}>
                    <div style={{
                      color: "#fff", fontSize: "12px", fontWeight: 700, lineHeight: "1.2",
                      wordBreak: "break-all", height: "100%", display: "flex",
                      alignItems: "center", overflow: "hidden",
                    } as React.CSSProperties}>
                      {node.text}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>

        {nodes.length <= 1 && !showFwSelect && !pendingFw && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl p-6 text-center shadow-sm mx-8">
              <p className="text-3xl mb-3">🧠</p>
              <p className="text-sm font-bold text-gray-700 mb-1">フレームワークを選んで始めよう</p>
              <p className="text-xs text-gray-400">または、ルートをタップして手動で作成</p>
            </div>
          </div>
        )}
      </div>

      {/* 選択ノードのアクションバー */}
      {selected && !showFwSelect && !pendingFw && !showInput && (
        <div className="absolute bottom-14 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: selectedNode?.color }} />
            <p className="text-sm font-bold text-gray-800 flex-1 truncate">{selectedNode?.text}</p>
            <button onClick={() => setSelected(null)} className="text-gray-400 text-xl leading-none p-1">✕</button>
          </div>
          <div className="flex gap-2">
            <button onClick={openAdd} className="flex-1 bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl active:bg-blue-700">＋ 子ノード</button>
            <button onClick={openEdit} className="bg-gray-100 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl active:bg-gray-200">✏ 編集</button>
            <button onClick={() => changeColor(selected)}
              className="text-xs px-3 py-2.5 rounded-xl font-bold active:opacity-70"
              style={{ backgroundColor: (selectedNode?.color ?? "#000") + "25", color: selectedNode?.color }}>🎨</button>
            {!isRoot && (
              <button onClick={() => deleteNode(selected)} className="bg-red-50 text-red-500 font-bold text-xs px-4 py-2.5 rounded-xl active:bg-red-100">削除</button>
            )}
          </div>
        </div>
      )}

      {/* テキスト入力モーダル */}
      {showInput && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowInput(false)}>
          <div className="bg-white rounded-t-3xl w-full px-4 pt-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3 text-center">
              {inputMode === "add" ? "子ノードを追加" : "ノードを編集"}
            </h3>
            <input autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitInput(); }}
              placeholder="テキストを入力..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-3 mt-3">
              <button onClick={() => setShowInput(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm">キャンセル</button>
              <button onClick={commitInput}
                className={`flex-1 font-bold py-3 rounded-2xl text-sm text-white ${inputText.trim() ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"}`}>
                {inputMode === "add" ? "追加" : "更新"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フレームワーク選択モーダル */}
      {showFwSelect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFwSelect(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-900">📐 フレームワークを選択</h3>
              <button onClick={() => setShowFwSelect(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="overflow-y-auto p-4">
              <p className="text-xs text-gray-400 mb-3">選択するとテンプレートが読み込まれます（現在のマップは置き換わります）</p>
              <div className="grid grid-cols-2 gap-3">
                {FRAMEWORKS.map((fw) => (
                  <button key={fw.id} onClick={() => selectFramework(fw)}
                    className="text-left bg-white border-2 border-gray-100 rounded-2xl p-3 active:border-purple-300 active:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{fw.icon}</span>
                      <span className="font-bold text-sm text-gray-900 leading-tight">{fw.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{fw.description}</p>
                    <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: fw.accent }} />
                  </button>
                ))}
              </div>
              <div className="pb-4" />
            </div>
          </div>
        </div>
      )}

      {/* フレームワーク適用：テーマ入力 */}
      {pendingFw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPendingFw(null)}>
          <div className="bg-white rounded-t-3xl w-full px-4 pt-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{pendingFw.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900">{pendingFw.name}</h3>
                <p className="text-xs text-gray-400">{pendingFw.description}</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">テーマ・タイトルを入力</label>
            <input autoFocus value={fwTopic} onChange={(e) => setFwTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyFramework(); }}
              placeholder={`例: 新商品開発、${pendingFw.name}分析…`}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">空欄のままでも適用できます</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setPendingFw(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm">キャンセル</button>
              <button onClick={applyFramework}
                className="flex-1 text-white font-bold py-3 rounded-2xl text-sm active:opacity-80"
                style={{ backgroundColor: pendingFw.accent }}>
                このフレームワークで開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
