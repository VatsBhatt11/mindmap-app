import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore from '../../store/useStore';
import CustomNode from './CustomNode';
import { getLayoutedElements, HANDLE_IDS } from './useAutoLayout';

const nodeTypes = { customNode: CustomNode };

const COMIC_COLORS = [
  '#FFE566', '#FF8FAB', '#A8E6CF', '#89CFF0', '#D4A5FF',
  '#FFB347', '#98FF98', '#FFDAB9', '#C3B1E1', '#AECBFA',
];

let idCounter = 1;
function nextId() { return `node-${idCounter++}-${Date.now()}`; }

const EDGE_STYLE = { stroke: '#1a1a1a', strokeWidth: 2.5 };

export default function MindmapCanvas({ onSave }) {
  const { fitView, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const pendingNodes = useStore((s) => s.pendingNodes);
  const pendingEdges = useStore((s) => s.pendingEdges);
  const onNodesChange = useStore((s) => s.onNodesChange);
  const onEdgesChange = useStore((s) => s.onEdgesChange);
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const addNode = useStore((s) => s.addNode);
  const addEdge = useStore((s) => s.addEdge);
  const setActiveNodeId = useStore((s) => s.setActiveNodeId);
  const layoutDir = useStore((s) => s.layoutDir);
  const setLayoutDir = useStore((s) => s.setLayoutDir);
  const pushHistory = useStore((s) => s.pushHistory);
  const saveTimeout = useRef(null);
  const wrapperRef = useRef(null);

  const [addingNode, setAddingNode] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [locked, setLocked] = useState(false);

  const allNodes = [...nodes, ...pendingNodes];
  const allEdges = [...edges, ...pendingEdges];

  useEffect(() => {
    if (!onSave) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSave({ nodes, edges });
    }, 1500);
    return () => clearTimeout(saveTimeout.current);
  }, [nodes, edges, onSave]);

  useEffect(() => {
    if (!addingNode) return;
    const handler = (e) => { if (e.key === 'Escape') setAddingNode(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addingNode]);

  const onNodeDoubleClick = useCallback(
    (_e, node) => {
      if (!node.data?.preview) setActiveNodeId(node.id);
    },
    [setActiveNodeId]
  );

  // Push history when a node drag completes (position change committed)
  const onNodeDragStop = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const onPaneClick = useCallback(
    (event) => {
      if (!addingNode) return;
      const { clientX, clientY } = event;
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const id = nextId();
      const randomColor = COMIC_COLORS[Math.floor(Math.random() * COMIC_COLORS.length)];
      pushHistory();
      addNode({
        id,
        type: 'customNode',
        position,
        data: { label: 'New Node', details: '', color: randomColor },
        origin: [0.5, 0.5],
      });
      setAddingNode(false);
    },
    [addingNode, screenToFlowPosition, addNode, pushHistory]
  );

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        const id = nextId();
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const position = screenToFlowPosition({ x: clientX, y: clientY });
        const sourceNodeId = connectionState.fromNode?.id;
        const randomColor = COMIC_COLORS[Math.floor(Math.random() * COMIC_COLORS.length)];

        // Use stable handle IDs matching CustomNode — this is what fixes edge routing
        const { source: sourceHandle, target: targetHandle } = HANDLE_IDS[layoutDir] ?? HANDLE_IDS.LR;

        pushHistory();
        addNode({
          id,
          type: 'customNode',
          position,
          data: { label: 'New Node', details: '', color: randomColor },
          origin: [0.5, 0],
        });

        if (sourceNodeId) {
          addEdge({
            id: `edge-${sourceNodeId}-${id}`,
            source: sourceNodeId,
            target: id,
            type: 'smoothstep',
            style: EDGE_STYLE,
            sourceHandle,
            targetHandle,
          });
        }
      }
    },
    [screenToFlowPosition, addNode, addEdge, layoutDir, pushHistory]
  );

  function autoLayout(dir = layoutDir) {
    pushHistory();
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, dir);
    setNodes(ln);
    setEdges(le);
    setTimeout(() => fitView({ duration: 400 }), 50);
  }

  function toggleDirection() {
    const next = layoutDir === 'LR' ? 'TB' : 'LR';
    setLayoutDir(next);
    autoLayout(next);
  }

  const ctrlBtnStyle = {
    width: 34,
    height: 34,
    background: '#fff',
    border: '2.5px solid #1a1a1a',
    borderRadius: 8,
    boxShadow: '2px 2px 0 #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.1s',
    color: '#1a1a1a',
    flexShrink: 0,
  };

  const ctrlHover = {
    onMouseEnter: (e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; },
    onMouseLeave: (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'; },
  };

  const panelBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: '#fff',
    border: '2.5px solid #1a1a1a',
    borderRadius: 10,
    boxShadow: '3px 3px 0 #1a1a1a',
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.1s',
    color: '#1a1a1a',
  };

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full relative overflow-hidden"
      style={{ cursor: addingNode ? 'none' : undefined }}
      onMouseMove={(e) => {
        if (!addingNode || !wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      {addingNode && (
        <div
          style={{
            position: 'absolute',
            left: cursorPos.x - 14,
            top: cursorPos.y - 14,
            width: 28,
            height: 28,
            pointerEvents: 'none',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            fontWeight: 900,
            color: '#6d28d9',
            fontFamily: "'Nunito', sans-serif",
            userSelect: 'none',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            lineHeight: 1,
          }}
        >
          +
        </div>
      )}

      {addingNode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: '#fff',
            border: '2.5px solid #1a1a1a',
            borderRadius: 10,
            boxShadow: '3px 3px 0 #1a1a1a',
            padding: '5px 16px',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            color: '#1a1a1a',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Click anywhere to place node · Esc to cancel
        </div>
      )}

      <ReactFlow
        nodes={allNodes}
        edges={allEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeDragStop={onNodeDragStop}
        onConnectEnd={onConnectEnd}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        minZoom={0.05}
        maxZoom={4}
        nodesDraggable={!locked}
        nodesConnectable={!locked}
        defaultEdgeOptions={{
          style: EDGE_STYLE,
          type: 'smoothstep',
        }}
      >
        <Background color="#d4c9a8" gap={24} size={2} />

        <MiniMap
          position="bottom-left"
          nodeColor={(n) => n.data?.color || '#FFE566'}
          style={{
            border: '2.5px solid #1a1a1a',
            boxShadow: '4px 4px 0 #1a1a1a',
            borderRadius: 12,
          }}
          maskColor="rgba(0,0,0,0.06)"
        />

        {/* Control buttons — vertical stack beside MiniMap */}
        <Panel position="bottom-left" style={{ left: 222, bottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button title="Zoom in" style={ctrlBtnStyle} onClick={() => zoomIn({ duration: 200 })} {...ctrlHover}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button title="Zoom out" style={ctrlBtnStyle} onClick={() => zoomOut({ duration: 200 })} {...ctrlHover}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <button title="Fit view" style={ctrlBtnStyle} onClick={() => fitView({ duration: 400 })} {...ctrlHover}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            title={locked ? 'Unlock canvas' : 'Lock canvas'}
            style={{ ...ctrlBtnStyle, background: locked ? '#6d28d9' : '#fff', color: locked ? '#fff' : '#1a1a1a' }}
            onClick={() => setLocked((l) => !l)}
            {...ctrlHover}
          >
            {locked ? (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </button>
        </Panel>

        <Panel position="top-left" className="flex gap-2">
          <button
            style={
              addingNode
                ? { ...panelBtnStyle, background: '#6d28d9', color: '#fff', boxShadow: '1px 1px 0 #1a1a1a', transform: 'translate(1px,1px)' }
                : panelBtnStyle
            }
            onClick={() => setAddingNode((v) => !v)}
            onMouseEnter={(e) => {
              if (!addingNode) {
                e.currentTarget.style.transform = 'translate(-1px,-1px)';
                e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!addingNode) {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a';
              }
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Node
          </button>

          <button
            style={panelBtnStyle}
            onClick={() => autoLayout()}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Auto Layout
          </button>

          <button
            style={{ ...panelBtnStyle, background: layoutDir === 'LR' ? '#6d28d9' : '#fff', color: layoutDir === 'LR' ? '#fff' : '#1a1a1a' }}
            onClick={toggleDirection}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; }}
            title="Toggle layout direction"
          >
            {layoutDir === 'LR' ? (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                Left → Right
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Top → Down
              </>
            )}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
