"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadMindNodes, saveMindNodes } from "@/lib/dashboard-storage";
import { MindNode } from "@/types";

// ─── レイアウト定数 ────────────────────────────────────────────────────────────
const NW = 140;   // ノード幅
const NH = 40;    // ノード高さ
const HGAP = 72;  // 水平間隔
const VSLOT = 56; // 1ノード分の垂直スロット

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1"];

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

// ─── ベジェ曲線パス ────────────────────────────────────────────────────────────
function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

// ─── SVG全体の境界計算 ─────────────────────────────────────────────────────────
function getBounds(pos: Map<string, { x: number; y: number }>) {
  let minX = 0, minY = 0, maxX = NW, maxY = NH;
  pos.forEach(({ x, y }) => {
    minX = Math.min(minX, x - 12);
    minY = Math.min(minY, y - 12);
    maxX = Math.max(maxX, x + NW + 12);
    maxY = Math.max(maxY, y + NH + 12);
  });
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

export default function MindMapPage() {
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputMode, setInputMode] = useState<"add" | "edit">("add");
  const [offset, setOffset] = useState({ x: 16, y: 16 });
  const [scale, setScale] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const lastPinchRef = useRef<number | null>(null);

  useEffect(() => { setNodes(loadMindNodes()); }, []);

  function save(updated: MindNode[]) {
    setNodes(updated);
    saveMindNodes(updated);
  }

  // ─── 追加 ────────────────────────────────────────────────────────────────────
  function openAdd() {
    if (!selected) return;
    setInputText("");
    setInputMode("add");
    setShowInput(true);
  }

  function openEdit() {
    if (!selected) return;
    const node = nodes.find((n) => n.id === selected);
    if (!node) return;
    setInputText(node.text);
    setInputMode("edit");
    setShowInput(true);
  }

  function commitInput() {
    const text = inputText.trim();
    if (!text) { setShowInput(false); return; }
    if (inputMode === "add" && selected) {
      const parentNode = nodes.find((n) => n.id === selected)!;
      const depth = getDepth(selected, nodes);
      const color = COLORS[depth % COLORS.length];
      const newNode: MindNode = { id: crypto.randomUUID(), text, parentId: selected, color };
      save([...nodes, newNode]);
      void parentNode;
    } else if (inputMode === "edit" && selected) {
      save(nodes.map((n) => n.id === selected ? { ...n, text } : n));
    }
    setShowInput(false);
    setInputText("");
  }

  function deleteNode(id: string) {
    // 子孫ごと削除
    function collectDescendants(nid: string): string[] {
      const children = nodes.filter((n) => n.parentId === nid);
      return [nid, ...children.flatMap((c) => collectDescendants(c.id))];
    }
    const toDelete = new Set(collectDescendants(id));
    save(nodes.filter((n) => !toDelete.has(n.id)));
    setSelected(null);
  }

  function changeColor(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const idx = (COLORS.indexOf(node.color) + 1) % COLORS.length;
    save(nodes.map((n) => n.id === id ? { ...n, color: COLORS[idx] } : n));
  }

  function getDepth(id: string, ns: MindNode[]): number {
    let depth = 0;
    let cur = ns.find((n) => n.id === id);
    while (cur?.parentId) { depth++; cur = ns.find((n) => n.id === cur!.parentId); }
    return depth;
  }

  // ─── パン操作（タッチ・マウス） ───────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  // ─── ピンチズーム ─────────────────────────────────────────────────────────────
  const onTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (lastPinchRef.current !== null) {
      const ratio = d / lastPinchRef.current;
      setScale((s) => Math.max(0.4, Math.min(2.5, s * ratio)));
    }
    lastPinchRef.current = d;
  }, []);

  const onTouchEnd = useCallback(() => { lastPinchRef.current = null; }, []);

  const pos = layoutNodes(nodes);
  const bounds = getBounds(pos);

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
        <button
          onClick={() => { setSelected(null); setScale(1); setOffset({ x: 16, y: 60 }); }}
          className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
        >リセット表示</button>
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
            {/* 接続線 */}
            {nodes.map((node) => {
              if (!node.parentId) return null;
              const p = pos.get(node.parentId);
              const c = pos.get(node.id);
              if (!p || !c) return null;
              return (
                <path
                  key={`line-${node.id}`}
                  d={bezierPath(p.x + NW, p.y + NH / 2, c.x, c.y + NH / 2)}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              );
            })}
            {/* ノード */}
            {nodes.map((node) => {
              const p = pos.get(node.id);
              if (!p) return null;
              const isSel = node.id === selected;
              return (
                <g
                  key={node.id}
                  data-node="true"
                  transform={`translate(${p.x},${p.y})`}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : node.id); }}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    width={NW} height={NH} rx={NH / 2}
                    fill={node.color}
                    opacity={isSel ? 1 : 0.85}
                    stroke={isSel ? "#fff" : "transparent"}
                    strokeWidth={isSel ? 3 : 0}
                    style={{ filter: isSel ? "drop-shadow(0 0 6px rgba(0,0,0,0.3))" : "none" }}
                  />
                  <foreignObject x={8} y={4} width={NW - 16} height={NH - 8}>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 700,
                        lineHeight: "1.25",
                        wordBreak: "break-all",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                      } as React.CSSProperties}
                    >
                      {node.text}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>

        {/* 選択なしヒント */}
        {nodes.length <= 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2">🧠</p>
              <p className="text-sm font-medium text-gray-700">ルートノードをタップして</p>
              <p className="text-sm text-gray-500">「子ノード追加」から始めましょう</p>
            </div>
          </div>
        )}
      </div>

      {/* 選択中ノードのアクションバー */}
      {selected && (
        <div className="absolute bottom-14 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: selectedNode?.color }}
            />
            <p className="text-sm font-bold text-gray-800 flex-1 truncate">{selectedNode?.text}</p>
            <button onClick={() => setSelected(null)} className="text-gray-400 text-xl leading-none p-1">✕</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAdd}
              className="flex-1 bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl active:bg-blue-700"
            >＋ 子ノード追加</button>
            <button
              onClick={openEdit}
              className="bg-gray-100 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl active:bg-gray-200"
            >✏ 編集</button>
            <button
              onClick={() => changeColor(selected)}
              className="text-xs px-3 py-2.5 rounded-xl active:opacity-70"
              style={{ backgroundColor: selectedNode?.color + "33", color: selectedNode?.color, fontWeight: 700 }}
            >🎨 色</button>
            {!isRoot && (
              <button
                onClick={() => deleteNode(selected)}
                className="bg-red-50 text-red-500 font-bold text-xs px-4 py-2.5 rounded-xl active:bg-red-100"
              >削除</button>
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
            <input
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitInput(); }}
              placeholder="テキストを入力..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-3 mt-3">
              <button onClick={() => setShowInput(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-2xl text-sm active:bg-gray-200">キャンセル</button>
              <button
                onClick={commitInput}
                className={`flex-1 font-bold py-3 rounded-2xl text-sm text-white ${inputText.trim() ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"}`}
              >{inputMode === "add" ? "追加" : "更新"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
