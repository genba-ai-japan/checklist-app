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
type TplNode = { key: string; text: string; prompt?: string; parentKey: string | null; color: string };

function buildNodes(tpl: TplNode[]): MindNode[] {
  const keyToId = new Map<string, string>();
  tpl.forEach((t) => keyToId.set(t.key, crypto.randomUUID()));
  return tpl.map((t) => ({
    id: keyToId.get(t.key)!,
    text: t.text,
    prompt: t.prompt,
    parentId: t.parentKey ? keyToId.get(t.parentKey)! : null,
    color: t.color,
  }));
}

interface Framework {
  id: string; name: string; description: string; icon: string; accent: string;
  example: string;
  build: (topic: string) => MindNode[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: "mece", name: "MECE", description: "抜け漏れなく・ダブりなく分類する", icon: "🔲", accent: "#3b82f6", example: "例: 製品ラインナップの整理",
    build: (t) => buildNodes([
      { key:"r",   text: t || "テーマ",          prompt: undefined,  parentKey: null, color:"#1d4ed8" },
      { key:"a",   text:"コスト削減策",           prompt: "分類①",    parentKey:"r",   color:"#3b82f6" },
      { key:"a1",  text:"仕入れ価格の交渉",       prompt: "要素①",    parentKey:"a",   color:"#60a5fa" },
      { key:"a2",  text:"固定費の見直し",         prompt: "要素②",    parentKey:"a",   color:"#60a5fa" },
      { key:"b",   text:"品質向上策",             prompt: "分類②",    parentKey:"r",   color:"#10b981" },
      { key:"b1",  text:"検査工程の強化",         prompt: "要素①",    parentKey:"b",   color:"#34d399" },
      { key:"b2",  text:"スタッフ教育の充実",     prompt: "要素②",    parentKey:"b",   color:"#34d399" },
      { key:"c",   text:"スピード改善策",         prompt: "分類③",    parentKey:"r",   color:"#f59e0b" },
      { key:"c1",  text:"業務フローの自動化",     prompt: "要素①",    parentKey:"c",   color:"#fbbf24" },
      { key:"c2",  text:"ツール導入の検討",       prompt: "要素②",    parentKey:"c",   color:"#fbbf24" },
      { key:"d",   text:"新規開拓策",             prompt: "分類④",    parentKey:"r",   color:"#ef4444" },
      { key:"d1",  text:"ターゲット層の再定義",   prompt: "要素①",    parentKey:"d",   color:"#f87171" },
      { key:"d2",  text:"競合との差別化",         prompt: "要素②",    parentKey:"d",   color:"#f87171" },
    ]),
  },
  {
    id: "swot", name: "SWOT分析", description: "強み・弱み・機会・脅威で現状把握", icon: "⚖️", accent: "#10b981", example: "例: 新規事業参入の検討",
    build: (t) => buildNodes([
      { key:"r",   text: t || "テーマ",           prompt: undefined,   parentKey: null, color:"#1d4ed8" },
      { key:"s",   text:"独自技術・特許保有",      prompt: "強みは？",   parentKey:"r",   color:"#16a34a" },
      { key:"s1",  text:"特許取得済みの製造工程",  prompt: "具体例①",   parentKey:"s",   color:"#22c55e" },
      { key:"s2",  text:"熟練した技術者が揃う",    prompt: "具体例②",   parentKey:"s",   color:"#22c55e" },
      { key:"w",   text:"資金・リソース不足",      prompt: "弱みは？",   parentKey:"r",   color:"#dc2626" },
      { key:"w1",  text:"開発予算が限られている",  prompt: "具体例①",   parentKey:"w",   color:"#f87171" },
      { key:"w2",  text:"認知度がまだ低い",        prompt: "具体例②",   parentKey:"w",   color:"#f87171" },
      { key:"o",   text:"市場の成長・需要増加",    prompt: "機会は？",   parentKey:"r",   color:"#2563eb" },
      { key:"o1",  text:"DX推進で需要が拡大",      prompt: "具体例①",   parentKey:"o",   color:"#60a5fa" },
      { key:"o2",  text:"海外展開のチャンス",      prompt: "具体例②",   parentKey:"o",   color:"#60a5fa" },
      { key:"th",  text:"競合他社の台頭",          prompt: "脅威は？",   parentKey:"r",   color:"#d97706" },
      { key:"t1",  text:"大手企業の参入リスク",    prompt: "具体例①",   parentKey:"th",  color:"#fbbf24" },
      { key:"t2",  text:"原材料価格の高騰",        prompt: "具体例②",   parentKey:"th",  color:"#fbbf24" },
    ]),
  },
  {
    id: "scamper", name: "SCAMPER", description: "7つの視点でアイデアを発想する", icon: "💡", accent: "#f59e0b", example: "例: 既存商品のリニューアル",
    build: (t) => buildNodes([
      { key:"r",  text: t || "テーマ",              prompt: undefined,     parentKey: null, color:"#7c3aed" },
      { key:"s",  text:"材料を植物性に変更",        prompt: "S 代替?",     parentKey:"r",   color:"#3b82f6" },
      { key:"c",  text:"IoT機能を追加統合",         prompt: "C 組合せ?",   parentKey:"r",   color:"#10b981" },
      { key:"a",  text:"他業界の手法を取り入れる",  prompt: "A 応用?",     parentKey:"r",   color:"#f59e0b" },
      { key:"m",  text:"サイズを小型化・軽量化",    prompt: "M 修正?",     parentKey:"r",   color:"#ef4444" },
      { key:"p",  text:"高齢者向けに転用する",      prompt: "P 転用?",     parentKey:"r",   color:"#8b5cf6" },
      { key:"e",  text:"不要な機能を省いてシンプル化", prompt: "E 削除?",  parentKey:"r",   color:"#ec4899" },
      { key:"rv", text:"ユーザーが提供側に回る",    prompt: "R 逆転?",     parentKey:"r",   color:"#06b6d4" },
    ]),
  },
  {
    id: "why", name: "WHYツリー", description: "なぜを繰り返して根本原因を追求", icon: "🔍", accent: "#ef4444", example: "例: 不良品が増えている",
    build: (t) => buildNodes([
      { key:"r",    text: t || "問題・現象",          prompt: undefined,   parentKey: null,  color:"#b91c1c" },
      { key:"w1",   text:"人手が足りていない",         prompt: "なぜ①？",  parentKey:"r",    color:"#dc2626" },
      { key:"w11",  text:"採用コストが高い",           prompt: "なぜ？",    parentKey:"w1",   color:"#f87171" },
      { key:"w111", text:"採用チャネルが限られている", prompt: "根本原因",  parentKey:"w11",  color:"#fca5a5" },
      { key:"w12",  text:"離職率が高い",               prompt: "なぜ？",    parentKey:"w1",   color:"#f87171" },
      { key:"w121", text:"評価制度が不透明",           prompt: "根本原因",  parentKey:"w12",  color:"#fca5a5" },
      { key:"w2",   text:"業務効率が低下している",     prompt: "なぜ②？",  parentKey:"r",    color:"#dc2626" },
      { key:"w21",  text:"ツールが古く非効率",         prompt: "なぜ？",    parentKey:"w2",   color:"#f87171" },
      { key:"w211", text:"IT投資が後回しになっている", prompt: "根本原因",  parentKey:"w21",  color:"#fca5a5" },
      { key:"w22",  text:"手順が標準化されていない",   prompt: "なぜ？",    parentKey:"w2",   color:"#f87171" },
      { key:"w221", text:"マニュアルが整備されていない", prompt:"根本原因", parentKey:"w22",  color:"#fca5a5" },
    ]),
  },
  {
    id: "how", name: "HOWツリー", description: "どうやってを展開して解決策を導く", icon: "🛠️", accent: "#10b981", example: "例: 売上を改善する",
    build: (t) => buildNodes([
      { key:"r",   text: t || "目標・課題",         prompt: undefined,      parentKey: null, color:"#15803d" },
      { key:"h1",  text:"営業体制を強化する",       prompt: "どうやって①？", parentKey:"r",   color:"#16a34a" },
      { key:"h11", text:"訪問件数を週10件に増やす", prompt: "具体的には？",  parentKey:"h1",  color:"#22c55e" },
      { key:"h12", text:"提案資料を刷新する",       prompt: "具体的には？",  parentKey:"h1",  color:"#22c55e" },
      { key:"h2",  text:"既存顧客を深耕する",       prompt: "どうやって②？", parentKey:"r",   color:"#16a34a" },
      { key:"h21", text:"定期フォローコールを実施", prompt: "具体的には？",  parentKey:"h2",  color:"#22c55e" },
      { key:"h22", text:"アップセル提案を強化",     prompt: "具体的には？",  parentKey:"h2",  color:"#22c55e" },
      { key:"h3",  text:"新規チャネルを開拓する",   prompt: "どうやって③？", parentKey:"r",   color:"#16a34a" },
      { key:"h31", text:"SNS広告を活用する",        prompt: "具体的には？",  parentKey:"h3",  color:"#22c55e" },
      { key:"h32", text:"パートナー企業と連携",     prompt: "具体的には？",  parentKey:"h3",  color:"#22c55e" },
    ]),
  },
  {
    id: "pdca", name: "PDCA", description: "計画→実行→評価→改善のサイクル", icon: "🔄", accent: "#3b82f6", example: "例: 品質改善プロジェクト",
    build: (t) => buildNodes([
      { key:"r",  text: t || "テーマ",                  prompt: undefined,   parentKey: null, color:"#1d4ed8" },
      { key:"p",  text:"月次目標と行動計画を策定",       prompt: "P 計画は？", parentKey:"r",   color:"#3b82f6" },
      { key:"p1", text:"不良率を現状比50%削減",          prompt: "目標は？",  parentKey:"p",   color:"#60a5fa" },
      { key:"p2", text:"工程チェックを2重化する",        prompt: "手段は？",  parentKey:"p",   color:"#60a5fa" },
      { key:"p3", text:"4月〜6月の3ヶ月間",             prompt: "期間は？",  parentKey:"p",   color:"#60a5fa" },
      { key:"d",  text:"計画通りに工程改善を実施",       prompt: "D 実行は？", parentKey:"r",  color:"#16a34a" },
      { key:"d1", text:"チェックシートを全ライン導入",   prompt: "内容は？",  parentKey:"d",   color:"#22c55e" },
      { key:"d2", text:"品質管理チーム全員",             prompt: "担当は？",  parentKey:"d",   color:"#22c55e" },
      { key:"c",  text:"月末に数値を確認・比較",         prompt: "C 評価は？", parentKey:"r",  color:"#d97706" },
      { key:"c1", text:"目標の80%達成を確認",            prompt: "達成度は？", parentKey:"c",  color:"#fbbf24" },
      { key:"c2", text:"夜間ラインでミスが多発",         prompt: "課題は？",  parentKey:"c",   color:"#fbbf24" },
      { key:"a",  text:"夜間ラインの体制を見直す",       prompt: "A 改善は？", parentKey:"r",  color:"#dc2626" },
      { key:"a1", text:"夜間専任リーダーを配置",         prompt: "改善点は？", parentKey:"a",  color:"#f87171" },
      { key:"a2", text:"改善策を次月計画に組み込む",     prompt: "次Pへは？", parentKey:"a",   color:"#f87171" },
    ]),
  },
  {
    id: "project", name: "プロジェクトマッピング", description: "プロジェクト全体を俯瞰して整理", icon: "📋", accent: "#8b5cf6", example: "例: 新工場の立ち上げ",
    build: (t) => buildNodes([
      { key:"r",   text: t || "プロジェクト名",        prompt: undefined,    parentKey: null, color:"#7c3aed" },
      { key:"g",   text:"新市場への参入と収益化",      prompt: "目的は？",   parentKey:"r",   color:"#8b5cf6" },
      { key:"g1",  text:"初年度売上1,000万円達成",     prompt: "ゴールは？", parentKey:"g",   color:"#a78bfa" },
      { key:"st",  text:"営業・開発・マーケの3部門",   prompt: "誰が関わる？", parentKey:"r", color:"#2563eb" },
      { key:"st1", text:"各部門から2名ずつ選出",       prompt: "メンバーは？", parentKey:"st", color:"#60a5fa" },
      { key:"sc",  text:"国内ECサイトの立ち上げ",      prompt: "範囲は？",   parentKey:"r",   color:"#16a34a" },
      { key:"sc1", text:"20〜40代の個人顧客向け",      prompt: "対象は？",   parentKey:"sc",  color:"#22c55e" },
      { key:"sk",  text:"6ヶ月でローンチ予定",         prompt: "いつまで？", parentKey:"r",   color:"#d97706" },
      { key:"sk1", text:"3ヶ月後にβ版リリース",        prompt: "節目は？",   parentKey:"sk",  color:"#fbbf24" },
      { key:"rs",  text:"競合の先行リスクがある",       prompt: "リスクは？", parentKey:"r",   color:"#dc2626" },
      { key:"rs1", text:"差別化機能の先行開発",         prompt: "対策は？",   parentKey:"rs",  color:"#f87171" },
      { key:"re",  text:"予算500万・人員6名",           prompt: "リソースは？", parentKey:"r", color:"#0891b2" },
      { key:"re1", text:"Q1予算から前倒し確保",         prompt: "確保策は？", parentKey:"re",  color:"#22d3ee" },
    ]),
  },
  {
    id: "system", name: "システムシンキング", description: "要素と関係性でシステム全体を把握", icon: "🕸️", accent: "#06b6d4", example: "例: 生産ラインの効率化",
    build: (t) => buildNodes([
      { key:"r",    text: t || "システム・テーマ",       prompt: undefined,     parentKey: null, color:"#0e7490" },
      { key:"el",   text:"需要・供給・在庫・コスト",     prompt: "構成要素は？", parentKey:"r",   color:"#0891b2" },
      { key:"el1",  text:"顧客需要の変動パターン",       prompt: "要素①",       parentKey:"el",  color:"#22d3ee" },
      { key:"el2",  text:"供給能力の上限制約",           prompt: "要素②",       parentKey:"el",  color:"#22d3ee" },
      { key:"el3",  text:"在庫水準の適正管理",           prompt: "要素③",       parentKey:"el",  color:"#22d3ee" },
      { key:"rel",  text:"需要増→生産増→コスト増",      prompt: "関係性は？",   parentKey:"r",   color:"#7c3aed" },
      { key:"rel1", text:"品質向上→口コミ→需要増",      prompt: "強化ループ",   parentKey:"rel", color:"#8b5cf6" },
      { key:"rel2", text:"価格上昇→需要減→価格下降",    prompt: "均衡ループ",   parentKey:"rel", color:"#a78bfa" },
      { key:"lev",  text:"需要予測の精度を高める",       prompt: "介入点は？",   parentKey:"r",   color:"#16a34a" },
      { key:"lev1", text:"AIによる需要予測を導入",       prompt: "具体策は？",   parentKey:"lev", color:"#22c55e" },
      { key:"ext",  text:"規制・競合・景気の変化",       prompt: "外部要因は？", parentKey:"r",   color:"#d97706" },
      { key:"ext1", text:"法改正で設備投資が必要",       prompt: "影響は？",     parentKey:"ext", color:"#fbbf24" },
    ]),
  },
  {
    id: "5w1h", name: "5W1H", description: "6つの問いで情報を網羅的に整理", icon: "❓", accent: "#ec4899", example: "例: 新製品の販売計画",
    build: (t) => buildNodes([
      { key:"r",      text: t || "テーマ",              prompt: undefined,      parentKey: null,    color:"#be185d" },
      { key:"who",    text:"営業部門の全メンバー",       prompt: "Who 誰が？",   parentKey:"r",      color:"#ec4899" },
      { key:"who1",   text:"チームリーダー3名が主導",    prompt: "詳しくは？",   parentKey:"who",    color:"#f472b6" },
      { key:"what",   text:"新製品の提案活動を実施",     prompt: "What 何を？",  parentKey:"r",      color:"#8b5cf6" },
      { key:"what1",  text:"デモ機を使ったプレゼン",     prompt: "詳しくは？",   parentKey:"what",   color:"#a78bfa" },
      { key:"when",   text:"4月〜6月の四半期内に",       prompt: "When いつ？",  parentKey:"r",      color:"#2563eb" },
      { key:"when1",  text:"月10件の訪問ペースで",       prompt: "詳しくは？",   parentKey:"when",   color:"#60a5fa" },
      { key:"where",  text:"関東エリアの既存顧客先",     prompt: "Where どこで？", parentKey:"r",    color:"#16a34a" },
      { key:"where1", text:"都内・神奈川・埼玉を優先",   prompt: "詳しくは？",   parentKey:"where",  color:"#22c55e" },
      { key:"why",    text:"売上目標達成のため",         prompt: "Why なぜ？",   parentKey:"r",      color:"#dc2626" },
      { key:"why1",   text:"前期比120%が今期の目標",     prompt: "詳しくは？",   parentKey:"why",    color:"#f87171" },
      { key:"how",    text:"訪問販売とオンライン併用",   prompt: "How どのように？", parentKey:"r",  color:"#d97706" },
      { key:"how1",   text:"Zoom会議で遠方顧客をカバー", prompt: "詳しくは？",   parentKey:"how",    color:"#fbbf24" },
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
  const [activeFrameworkId, setActiveFrameworkId] = useState<string | null>(null);

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
    setActiveFrameworkId(pendingFw.id);
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
          <h1 className="text-lg font-bold text-gray-900">🗺️ マインドマップ</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {activeFrameworkId && (() => { const fw = FRAMEWORKS.find(f => f.id === activeFrameworkId); return fw ? (
              <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">{fw.icon} {fw.name}</span>
            ) : null; })()}
            <p className="text-[10px] text-gray-400">ドラッグでスクロール　ピンチでズーム</p>
          </div>
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
            {/* 接続線 ＋ 線上のテキストラベル */}
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const p = pos.get(node.parentId), c = pos.get(node.id);
              if (!p || !c) return null;
              const x1 = p.x + NW, y1 = p.y + NH / 2;
              const x2 = c.x, y2 = c.y + NH / 2;
              const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2;
              const raw = node.prompt ?? node.text;
              const label = raw.length > 13 ? raw.slice(0, 12) + "…" : raw;
              const lw = label.length * 6 + 14;
              return (
                <g key={`edge-${node.id}`}>
                  <path d={bezierPath(x1, y1, x2, y2)}
                    fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.35} />
                  <rect x={lx - lw / 2} y={ly - 18} width={lw} height={16}
                    rx={8} fill="white" stroke={node.color} strokeWidth={1} strokeOpacity={0.5} />
                  <text x={lx} y={ly - 7} textAnchor="middle"
                    fill={node.color} fontSize={10} fontWeight={700} opacity={0.95}>
                    {label}
                  </text>
                </g>
              );
            })}
            {/* ノード */}
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
            {/* ➕ ボタン（各ノードの右上に配置） */}
            {nodes.map((node) => {
              const p = pos.get(node.id);
              if (!p) return null;
              return (
                <g key={`add-${node.id}`} data-node="true"
                  transform={`translate(${p.x + NW},${p.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(node.id);
                    setInputText("");
                    setInputMode("add");
                    setShowInput(true);
                  }}
                  style={{ cursor: "pointer" }}>
                  <circle r={11} fill="#eff6ff" stroke="#93c5fd" strokeWidth={1.5} />
                  <text textAnchor="middle" dominantBaseline="central"
                    fill="#2563eb" fontSize={18} fontWeight={700} y={1}>+</text>
                </g>
              );
            })}
          </g>
        </svg>

        {nodes.length <= 1 && !showFwSelect && !pendingFw && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 rounded-2xl p-6 text-center shadow-sm mx-8">
              <p className="text-3xl mb-3">🗺️</p>
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
          <div className="bg-white rounded-t-3xl w-full overflow-y-auto flex flex-col"
            style={{ maxHeight: '85dvh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-2">
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
                placeholder={pendingFw.example}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">空欄のままでも適用できます</p>
            </div>
            <div className="sticky bottom-0 bg-white px-4 pt-3 pb-10 border-t border-gray-100 flex gap-3">
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
