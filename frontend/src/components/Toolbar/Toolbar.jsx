import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import useStore from '../../store/useStore';
import { getLayoutedElements } from '../Canvas/useAutoLayout';

// ── Markdown builder ──────────────────────────────────────────────────────────
function buildMarkdown(nodes, edges) {
  const children = {};
  nodes.forEach((n) => { children[n.id] = []; });
  edges.forEach((e) => { if (children[e.source]) children[e.source].push(e.target); });

  const targets = new Set(edges.map((e) => e.target));
  const root = nodes.find((n) => !targets.has(n.id)) || nodes[0];
  if (!root) return '';

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  function renderNode(id, depth) {
    const node = nodeMap[id];
    if (!node) return '';
    const prefix = '#'.repeat(Math.min(depth + 1, 6));
    let md = `${prefix} ${node.data.label}\n`;
    if (node.data.details) {
      const stripped = node.data.details
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .filter(Boolean)
        .map((l) => `  ${l}`)
        .join('\n');
      if (stripped) md += `\n${stripped}\n`;
    }
    (children[id] || []).forEach((cid) => { md += renderNode(cid, depth + 1); });
    return md + '\n';
  }

  return `---\nmarkmap:\n  colorFreezeLevel: 2\n---\n\n${renderNode(root.id, 0)}`;
}

// ── JSON builder ──────────────────────────────────────────────────────────────
function buildJson(nodes, edges) {
  return JSON.stringify(
    {
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type, style: e.style })),
    },
    null,
    2
  );
}

// ── Markdown parser for import ────────────────────────────────────────────────
const IMPORT_COLORS = [
  '#FFE566', '#FF8FAB', '#A8E6CF', '#89CFF0', '#D4A5FF',
  '#FFB347', '#98FF98', '#FFDAB9', '#C3B1E1', '#AECBFA',
];

function parseMarkdownToFlow(md) {
  const lines = md.split('\n').filter((l) => /^#{1,6}\s/.test(l.trim()));
  const nodes = [];
  const edges = [];
  const stack = [];

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (!match) return;
    const depth = match[1].length;
    const label = match[2].trim();
    const id = `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    nodes.push({
      id,
      type: 'customNode',
      position: { x: 0, y: 0 },
      data: { label, details: '', color: IMPORT_COLORS[depth % IMPORT_COLORS.length] },
    });

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();

    if (stack.length > 0) {
      const parentId = stack[stack.length - 1].id;
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        style: { stroke: '#1a1a1a', strokeWidth: 2.5 },
      });
    }

    stack.push({ id, depth });
  });

  return { nodes, edges };
}

// ── Export helpers ────────────────────────────────────────────────────────────
const EXPORT_W = 2400;
const EXPORT_H = 1600;

async function captureFlow(reactFlowInstance) {
  const nodesBounds = getNodesBounds(reactFlowInstance.getNodes());
  const viewport = getViewportForBounds(nodesBounds, EXPORT_W, EXPORT_H, 0.4, 2, 80);
  const viewportEl = document.querySelector('.react-flow__viewport');
  if (!viewportEl) throw new Error('ReactFlow viewport not found');
  return { viewportEl, viewport };
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const comicBtn = (bg = '#fff', color = '#1a1a1a') => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  background: bg,
  border: '2.5px solid #1a1a1a',
  borderRadius: 10,
  boxShadow: '3px 3px 0 #1a1a1a',
  fontSize: 13,
  fontWeight: 800,
  fontFamily: "'Nunito', sans-serif",
  cursor: 'pointer',
  color,
  whiteSpace: 'nowrap',
  transition: 'all 0.1s',
});

const iconBtn = (disabled = false) => ({
  width: 34,
  height: 34,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: disabled ? '#f3f4f6' : '#fff',
  border: '2.5px solid #1a1a1a',
  borderRadius: 9,
  boxShadow: disabled ? '1px 1px 0 #ccc' : '3px 3px 0 #1a1a1a',
  cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#aaa' : '#1a1a1a',
  transition: 'all 0.1s',
  flexShrink: 0,
});

const hoverOn = (e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; };
const hoverOff = (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; };

// ── Component ─────────────────────────────────────────────────────────────────
export default function Toolbar({ mindmapTitle }) {
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const deleteSelected = useStore((s) => s.deleteSelected);
  const pushHistory = useStore((s) => s.pushHistory);
  const past = useStore((s) => s.past);
  const future = useStore((s) => s.future);
  const layoutDir = useStore((s) => s.layoutDir);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const hasSelected = nodes.some((n) => n.selected);

  const [exporting, setExporting] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef(null);
  const importTypeRef = useRef(null);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept when typing in an input or textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Exports ──────────────────────────────────────────────────────────────
  function downloadMarkdown() {
    const md = buildMarkdown(nodes, edges);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${mindmapTitle || 'mindmap'}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportMenu(false);
  }

  function downloadJson() {
    const json = buildJson(nodes, edges);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${mindmapTitle || 'mindmap'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowExportMenu(false);
  }

  async function downloadJpeg() {
    setExporting('jpeg');
    setShowExportMenu(false);
    try {
      const { viewportEl, viewport } = await captureFlow(reactFlowInstance);
      const dataUrl = await toJpeg(viewportEl, {
        quality: 0.98,
        width: EXPORT_W,
        height: EXPORT_H,
        backgroundColor: '#f9f8f4',
        style: {
          width: `${EXPORT_W}px`,
          height: `${EXPORT_H}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: 'top left',
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${mindmapTitle || 'mindmap'}.jpg`;
      a.click();
    } catch (err) {
      console.error('JPEG export error:', err);
    } finally {
      setExporting(null);
    }
  }

  async function downloadPdf() {
    setExporting('pdf');
    setShowExportMenu(false);
    try {
      const { viewportEl, viewport } = await captureFlow(reactFlowInstance);
      const dataUrl = await toPng(viewportEl, {
        quality: 1,
        width: EXPORT_W,
        height: EXPORT_H,
        backgroundColor: '#f9f8f4',
        style: {
          width: `${EXPORT_W}px`,
          height: `${EXPORT_H}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: 'top left',
        },
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [EXPORT_W / 2, EXPORT_H / 2] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, EXPORT_W / 2, EXPORT_H / 2);
      pdf.save(`${mindmapTitle || 'mindmap'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(null);
    }
  }

  // ── Imports ───────────────────────────────────────────────────────────────
  function triggerImport(type) {
    importTypeRef.current = type;
    fileInputRef.current.accept = type === 'json' ? '.json' : '.md,.markdown';
    fileInputRef.current.click();
    setShowImportMenu(false);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      try {
        let parsed;
        if (importTypeRef.current === 'json') {
          const data = JSON.parse(content);
          const importedNodes = (data.nodes || []).map((n) => ({
            ...n,
            type: n.type || 'customNode',
            data: { ...n.data, color: n.data?.color || '#FFE566' },
          }));
          const importedEdges = (data.edges || []).map((edge) => ({
            ...edge,
            style: edge.style || { stroke: '#1a1a1a', strokeWidth: 2.5 },
          }));
          parsed = getLayoutedElements(importedNodes, importedEdges, layoutDir);
        } else {
          const { nodes: mn, edges: me } = parseMarkdownToFlow(content);
          parsed = getLayoutedElements(mn, me, layoutDir);
        }
        pushHistory();
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import file. Check the format and try again.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#fff',
        borderBottom: '2.5px solid #1a1a1a',
        boxShadow: '0 3px 0 #1a1a1a',
        fontFamily: "'Nunito', sans-serif",
        gap: 12,
      }}
    >
      {/* ── Left: back + title ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <button
          onClick={() => navigate('/dashboard')}
          title="Back to dashboard"
          style={{ ...comicBtn('#fff'), padding: '6px 10px', flexShrink: 0 }}
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#6d28d9',
              border: '2px solid #1a1a1a',
              boxShadow: '2px 2px 0 #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 20,
              letterSpacing: '0.06em',
              color: '#1a1a1a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mindmapTitle || 'Untitled Mindmap'}
          </span>
        </div>
      </div>

      {/* ── Center: Undo / Redo / Delete ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          style={iconBtn(!canUndo)}
          onClick={undo}
          onMouseEnter={canUndo ? hoverOn : undefined}
          onMouseLeave={canUndo ? hoverOff : undefined}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>

        <button
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          style={iconBtn(!canRedo)}
          onClick={redo}
          onMouseEnter={canRedo ? hoverOn : undefined}
          onMouseLeave={canRedo ? hoverOff : undefined}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>

        <div style={{ width: 1, height: 22, background: '#e5e7eb', margin: '0 2px' }} />

        <button
          title="Delete selected (Del)"
          disabled={!hasSelected}
          style={iconBtn(!hasSelected)}
          onClick={deleteSelected}
          onMouseEnter={hasSelected ? (e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#dc2626'; } : undefined}
          onMouseLeave={hasSelected ? (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#1a1a1a'; } : undefined}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* ── Right: Import / Export / Settings ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
        {/* Import */}
        <div style={{ position: 'relative' }}>
          <button
            style={comicBtn('#fff')}
            onClick={() => { setShowImportMenu((v) => !v); setShowExportMenu(false); }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showImportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 44,
                  background: '#fff',
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 #1a1a1a',
                  zIndex: 30,
                  minWidth: 180,
                  overflow: 'hidden',
                }}
              >
                {[
                  { label: 'Markdown (.md)', icon: '📄', type: 'md' },
                  { label: 'JSON (.json)', icon: '🗂', type: 'json' },
                ].map(({ label, icon, type }) => (
                  <button
                    key={type}
                    onClick={() => triggerImport(type)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif",
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1.5px solid #f0f0f0',
                      cursor: 'pointer',
                      color: '#1a1a1a',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f8f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Export */}
        <div style={{ position: 'relative' }}>
          <button
            style={comicBtn('#6d28d9', '#fff')}
            disabled={!!exporting}
            onClick={() => { setShowExportMenu((v) => !v); setShowImportMenu(false); }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            {exporting ? (
              <svg width="14" height="14" className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {exporting ? 'Exporting…' : 'Export'}
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 44,
                  background: '#fff',
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 #1a1a1a',
                  zIndex: 30,
                  minWidth: 190,
                  overflow: 'hidden',
                }}
              >
                {[
                  { label: 'Markmap Markdown', icon: '📄', action: downloadMarkdown },
                  { label: 'JSON', icon: '🗂', action: downloadJson },
                  { label: 'PDF', icon: '📑', action: downloadPdf },
                  { label: 'JPEG Image', icon: '🖼', action: downloadJpeg },
                ].map(({ label, icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif",
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1.5px solid #f0f0f0',
                      cursor: 'pointer',
                      color: '#1a1a1a',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f8f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>{icon}</span> {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings */}
        <button
          style={{ ...comicBtn('#fff'), padding: '6px 10px' }}
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
          onMouseEnter={hoverOn}
          onMouseLeave={hoverOff}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
    </header>
  );
}
