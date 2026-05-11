import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import useStore from '../../store/useStore';
import { aiResponseToFlow } from '../Canvas/useAutoLayout';

// ── Message bubble ────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif",
          lineHeight: 1.5,
          ...(isUser
            ? {
                background: '#6d28d9',
                border: '2px solid #1a1a1a',
                borderRadius: '14px 14px 4px 14px',
                boxShadow: '2px 2px 0 #1a1a1a',
                color: '#fff',
              }
            : msg.type === 'error'
            ? {
                background: '#fff0f3',
                border: '2px solid #1a1a1a',
                borderRadius: '14px 14px 14px 4px',
                boxShadow: '2px 2px 0 #1a1a1a',
                color: '#1a1a1a',
              }
            : {
                background: '#fff',
                border: '2px solid #1a1a1a',
                borderRadius: '14px 14px 14px 4px',
                boxShadow: '2px 2px 0 #1a1a1a',
                color: '#1a1a1a',
              }),
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ── Chat History Modal ────────────────────────────────────────────────────────
function ChatHistoryModal({ sessions, activeId, onSelect, onRename, onDelete, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  function startEdit(session) {
    setEditingId(session.id);
    setEditValue(session.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit(id) {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff',
            border: '2.5px solid #1a1a1a',
            borderRadius: 16,
            boxShadow: '6px 6px 0 #1a1a1a',
            width: 340,
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {/* Modal header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '2px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#6d28d9',
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '0.02em' }}>
              Chat History
            </span>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: 7,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Session list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {sessions.length === 0 && (
              <p style={{ padding: '24px 18px', textAlign: 'center', color: '#999', fontSize: 13, fontWeight: 700 }}>
                No chats yet.
              </p>
            )}
            {sessions.map((session, i) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderBottom: i < sessions.length - 1 ? '1.5px solid #f0f0f0' : 'none',
                  background: session.id === activeId ? '#f5f3ff' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onClick={() => { onSelect(session.id); onClose(); }}
                onMouseEnter={(e) => { if (session.id !== activeId) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={(e) => { if (session.id !== activeId) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Active indicator */}
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: session.id === activeId ? '#6d28d9' : '#d1d5db',
                  flexShrink: 0,
                  border: '1.5px solid #1a1a1a',
                }} />

                {/* Name / edit field */}
                {editingId === session.id ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(session.id);
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif",
                      border: '2px solid #6d28d9',
                      borderRadius: 6,
                      padding: '2px 8px',
                      outline: 'none',
                      background: '#fff',
                    }}
                  />
                ) : (
                  <span style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: session.id === activeId ? 900 : 700,
                    color: session.id === activeId ? '#6d28d9' : '#1a1a1a',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {session.name}
                  </span>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    title="Rename"
                    onClick={() => startEdit(session)}
                    style={{
                      width: 26,
                      height: 26,
                      border: '1.5px solid #d1d5db',
                      borderRadius: 6,
                      background: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6d28d9'; e.currentTarget.style.color = '#6d28d9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#666'; }}
                  >
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {sessions.length > 1 && (
                    <button
                      title="Delete"
                      onClick={() => onDelete(session.id)}
                      style={{
                        width: 26,
                        height: 26,
                        border: '1.5px solid #d1d5db',
                        borderRadius: 6,
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fff0f0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#666'; e.currentTarget.style.background = '#fff'; }}
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main ChatBot component ────────────────────────────────────────────────────
export default function ChatBot() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const pendingNodes = useStore((s) => s.pendingNodes);
  const layoutDir = useStore((s) => s.layoutDir);
  const setPendingChanges = useStore((s) => s.setPendingChanges);
  const approveChanges = useStore((s) => s.approveChanges);
  const rejectChanges = useStore((s) => s.rejectChanges);
  const chatSessions = useStore((s) => s.chatSessions);
  const activeChatSessionId = useStore((s) => s.activeChatSessionId);
  const addChatSession = useStore((s) => s.addChatSession);
  const setActiveChatSession = useStore((s) => s.setActiveChatSession);
  const updateSessionMessages = useStore((s) => s.updateSessionMessages);
  const renameChatSession = useStore((s) => s.renameChatSession);
  const deleteChatSession = useStore((s) => s.deleteChatSession);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef(null);

  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId) || chatSessions[0];
  const messages = activeSession?.messages || [];
  const selectedNode = nodes.find((n) => n.selected) || null;

  useEffect(() => { setHasPending(pendingNodes.length > 0); }, [pendingNodes]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { setInput(''); }, [activeChatSessionId]);

  function addMessage(msg) {
    updateSessionMessages(activeChatSessionId, [...messages, msg]);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const updatedMessages = [...messages, { role: 'user', content: userMsg }];
    updateSessionMessages(activeChatSessionId, updatedMessages);
    setLoading(true);

    try {
      const { data } = await api.post('/api/ai/generate', {
        prompt: userMsg,
        selectedNode: selectedNode ? { id: selectedNode.id, label: selectedNode.data.label } : null,
        canvasContext: {
          nodes: nodes.map((n) => ({ id: n.id, label: n.data.label })),
          edges: edges.map((e) => ({ source: e.source, target: e.target })),
        },
        conversationHistory: updatedMessages.slice(-10),
      });

      const { nodes: newNodes, edges: newEdges } = aiResponseToFlow(data, nodes, selectedNode, layoutDir);
      setPendingChanges(newNodes, newEdges);

      updateSessionMessages(activeChatSessionId, [
        ...updatedMessages,
        {
          role: 'assistant',
          content: `Generated ${newNodes.length} node${newNodes.length !== 1 ? 's' : ''} — shown as preview. Approve or reject below!`,
        },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Try again.';
      updateSessionMessages(activeChatSessionId, [
        ...updatedMessages,
        { role: 'assistant', type: 'error', content: msg },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleApprove() {
    approveChanges();
    addMessage({ role: 'assistant', content: 'Changes applied to the canvas!' });
  }

  function handleReject() {
    rejectChanges();
    addMessage({ role: 'assistant', content: 'Changes discarded.' });
  }

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "'Nunito', sans-serif",
    border: '2px solid #1a1a1a',
    borderRadius: 8,
    boxShadow: '2px 2px 0 #1a1a1a',
    cursor: 'pointer',
    transition: 'all 0.1s',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '2.5px solid #1a1a1a',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#6d28d9',
          borderBottom: '2.5px solid #1a1a1a',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            background: '#4ade80',
            border: '1.5px solid rgba(255,255,255,0.6)',
            borderRadius: '50%',
          }}
        />
        <span
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: 18,
            letterSpacing: '0.06em',
            color: '#fff',
            flex: 1,
          }}
        >
          AI Assistant
        </span>
        {selectedNode && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: 6,
              padding: '1px 7px',
              maxWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#fff',
            }}
          >
            {selectedNode.data.label}
          </span>
        )}
      </div>

      {/* Session controls: New Chat + Chat History */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '2px solid #1a1a1a',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        {/* Active session name */}
        <span
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: 800,
            color: '#6d28d9',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {activeSession?.name || 'Chat'}
        </span>

        {/* New Chat */}
        <button
          onClick={addChatSession}
          style={{ ...btnBase, background: '#fff', color: '#1a1a1a' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'; }}
          title="New chat"
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        {/* Chat History */}
        <button
          onClick={() => setShowHistory(true)}
          style={{ ...btnBase, background: '#6d28d9', color: '#fff', borderColor: '#1a1a1a' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'; }}
          title="View chat history"
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
          {chatSessions.length > 1 && (
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 10,
              padding: '0 5px',
              fontSize: 10,
              fontWeight: 900,
              lineHeight: '16px',
            }}>
              {chatSessions.length}
            </span>
          )}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 0 }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${activeChatSessionId}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Message msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div
              style={{
                background: '#fff',
                border: '2px solid #1a1a1a',
                borderRadius: '14px 14px 14px 4px',
                boxShadow: '2px 2px 0 #1a1a1a',
                padding: '8px 14px',
                display: 'flex',
                gap: 5,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: 7, height: 7, background: '#6d28d9', border: '1.5px solid #1a1a1a', borderRadius: '50%' }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.13 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approve / Reject */}
      <AnimatePresence>
        {hasPending && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '2px solid #1a1a1a' }}
          >
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#fff' }}>
              {[
                { label: 'Approve', bg: '#6d28d9', color: '#fff', action: handleApprove },
                { label: 'Reject', bg: '#fff', color: '#1a1a1a', action: handleReject },
              ].map(({ label, bg, color, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    background: bg,
                    border: '2px solid #1a1a1a',
                    borderRadius: 8,
                    boxShadow: '2px 2px 0 #1a1a1a',
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: 'pointer',
                    color,
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1a1a1a'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          borderTop: '2.5px solid #1a1a1a',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '10px 12px',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
          }}
          placeholder={selectedNode ? `Expand "${selectedNode.data.label}"…` : 'Describe a mindmap…'}
          rows={1}
          disabled={loading}
          style={{
            flex: 1,
            resize: 'none',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            padding: '8px 12px',
            border: '2px solid #1a1a1a',
            borderRadius: 10,
            outline: 'none',
            background: '#fafafa',
            maxHeight: 100,
            overflowY: 'auto',
            boxShadow: '2px 2px 0 #1a1a1a',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            width: 36,
            height: 36,
            background: loading || !input.trim() ? '#e5e7eb' : '#6d28d9',
            border: '2px solid #1a1a1a',
            borderRadius: 10,
            boxShadow: loading || !input.trim() ? '1px 1px 0 #999' : '2px 2px 0 #1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.1s',
            color: loading || !input.trim() ? '#999' : '#fff',
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
          </svg>
        </button>
      </form>

      {/* Chat History Modal */}
      {showHistory && (
        <ChatHistoryModal
          sessions={chatSessions}
          activeId={activeChatSessionId}
          onSelect={setActiveChatSession}
          onRename={renameChatSession}
          onDelete={deleteChatSession}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
