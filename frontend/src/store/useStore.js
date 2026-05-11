import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const MAX_HISTORY = 50;

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  // ── Current mindmap ───────────────────────────────────────────────────────
  currentMindmap: null,
  nodes: [],
  edges: [],
  setCurrentMindmap: (mindmap) => set({ currentMindmap: mindmap }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // Push to history before a significant change; call BEFORE mutating nodes/edges
  pushHistory: () =>
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), { nodes: state.nodes, edges: state.edges }],
      future: [],
    })),

  onNodesChange: (changes) => {
    // Intercept remove changes so Delete-key deletions are undoable
    if (changes.some((c) => c.type === 'remove')) get().pushHistory();
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
  },

  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === 'remove')) get().pushHistory();
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
  },

  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),

  deleteSelected: () =>
    set((state) => {
      const selectedIds = new Set(state.nodes.filter((n) => n.selected).map((n) => n.id));
      if (selectedIds.size === 0) return {};
      return {
        past: [...state.past.slice(-(MAX_HISTORY - 1)), { nodes: state.nodes, edges: state.edges }],
        future: [],
        nodes: state.nodes.filter((n) => !selectedIds.has(n.id)),
        edges: state.edges.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)),
      };
    }),

  // ── History ───────────────────────────────────────────────────────────────
  past: [],
  future: [],

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future.slice(0, MAX_HISTORY - 1)],
        nodes: previous.nodes,
        edges: previous.edges,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};
      const next = state.future[0];
      return {
        past: [...state.past.slice(-(MAX_HISTORY - 1)), { nodes: state.nodes, edges: state.edges }],
        future: state.future.slice(1),
        nodes: next.nodes,
        edges: next.edges,
      };
    }),

  // ── Layout direction ───────────────────────────────────────────────────────
  layoutDir: 'LR',
  setLayoutDir: (dir) => set({ layoutDir: dir }),

  // ── UI state ──────────────────────────────────────────────────────────────
  isSettingsOpen: false,
  activeNodeId: null,
  setIsSettingsOpen: (v) => set({ isSettingsOpen: v }),
  setActiveNodeId: (id) => set({ activeNodeId: id }),

  // ── Pending AI changes (approval workflow) ────────────────────────────────
  pendingNodes: [],
  pendingEdges: [],
  setPendingChanges: (nodes, edges) => set({ pendingNodes: nodes, pendingEdges: edges }),
  clearPendingChanges: () => set({ pendingNodes: [], pendingEdges: [] }),

  approveChanges: () => {
    const { nodes, edges, pendingNodes, pendingEdges, past } = get();
    const approved = pendingNodes.map((n) => ({
      ...n,
      data: { ...n.data, preview: false },
      style: { ...n.style, opacity: 1 },
    }));
    const approvedEdges = pendingEdges.map((e) => ({
      ...e,
      animated: false,
      style: { strokeDasharray: undefined },
    }));
    set({
      past: [...past.slice(-(MAX_HISTORY - 1)), { nodes, edges }],
      future: [],
      nodes: [...nodes, ...approved],
      edges: [...edges, ...approvedEdges],
      pendingNodes: [],
      pendingEdges: [],
    });
  },

  rejectChanges: () => set({ pendingNodes: [], pendingEdges: [] }),

  // ── Chat sessions ─────────────────────────────────────────────────────────
  chatSessions: [
    {
      id: 'session-1',
      name: 'Chat 1',
      messages: [
        {
          role: 'assistant',
          content: 'Hi! Tell me what mindmap to create, or select a node and ask me to expand it.',
        },
      ],
    },
  ],
  activeChatSessionId: 'session-1',

  addChatSession: () =>
    set((state) => {
      const id = `session-${Date.now()}`;
      return {
        chatSessions: [
          ...state.chatSessions,
          {
            id,
            name: `Chat ${state.chatSessions.length + 1}`,
            messages: [
              {
                role: 'assistant',
                content: 'Hi! What would you like to create or modify?',
              },
            ],
          },
        ],
        activeChatSessionId: id,
      };
    }),

  setActiveChatSession: (id) => set({ activeChatSessionId: id }),

  updateSessionMessages: (sessionId, messages) =>
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === sessionId ? { ...s, messages } : s
      ),
    })),

  renameChatSession: (sessionId, name) =>
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === sessionId ? { ...s, name } : s
      ),
    })),

  deleteChatSession: (sessionId) =>
    set((state) => {
      const remaining = state.chatSessions.filter((s) => s.id !== sessionId);
      const newActive =
        state.activeChatSessionId === sessionId
          ? (remaining[0]?.id ?? null)
          : state.activeChatSessionId;
      return { chatSessions: remaining, activeChatSessionId: newActive };
    }),
}));

export default useStore;
