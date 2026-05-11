import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
import useStore from '../store/useStore';
import SettingsModal from '../components/Settings/SettingsModal';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Card accent colors — these are content colors (user's maps), not UI chrome
const CARD_COLORS = ['#FFE566', '#FF8FAB', '#A8E6CF', '#89CFF0', '#D4A5FF', '#FFB347'];
const CARD_ROTATIONS = [-1.2, 0.8, -0.6, 1.1, -0.9, 0.5];

const btn = (bg = '#fff', color = '#1a1a1a') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 18px',
  background: bg,
  border: '2.5px solid #1a1a1a',
  borderRadius: 10,
  boxShadow: '3px 3px 0 #1a1a1a',
  fontSize: 14,
  fontWeight: 800,
  fontFamily: "'Nunito', sans-serif",
  cursor: 'pointer',
  color,
  transition: 'all 0.1s',
  letterSpacing: '0.02em',
});

const hoverOn = (e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a'; };
const hoverOff = (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a'; };

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const isSettingsOpen = useStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen);

  const [mindmaps, setMindmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchMindmaps(); }, []);

  async function fetchMindmaps() {
    try {
      console.log(api);

      const { data } = await api.get('/api/mindmaps');
      console.log(data);

      setMindmaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createMindmap(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/api/mindmaps', { title: newTitle.trim() });
      navigate(`/canvas/${data.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function deleteMindmap(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this mindmap?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/mindmaps/${id}`);
      setMindmaps((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f8f4', fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: '#fff',
          borderBottom: '2.5px solid #1a1a1a',
          boxShadow: '0 3px 0 #1a1a1a',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#6d28d9',
              border: '2.5px solid #1a1a1a',
              boxShadow: '3px 3px 0 #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Bangers', cursive", fontSize: 26, letterSpacing: '0.08em', color: '#1a1a1a' }}>
            MindFlow
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#666', display: window.innerWidth < 640 ? 'none' : 'block' }}>
            {user?.email}
          </span>
          <button style={btn('#fff')} onClick={() => setIsSettingsOpen(true)} title="Settings" onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button style={btn('#1a1a1a', '#fff')} onClick={handleSignOut} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: 38, letterSpacing: '0.08em', color: '#1a1a1a', margin: 0, lineHeight: 1.1 }}>
              My Mindmaps
            </h1>
            <p style={{ color: '#666', fontSize: 13, fontWeight: 700, margin: '4px 0 0' }}>
              {mindmaps.length} map{mindmaps.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            style={btn('#6d28d9', '#fff')}
            onClick={() => setShowNewForm(true)}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Mindmap
          </button>
        </div>

        {/* New mindmap form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={createMindmap}
              style={{ marginBottom: 24, overflow: 'hidden' }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 14,
                  boxShadow: '4px 4px 0 #1a1a1a',
                  padding: 16,
                  display: 'flex',
                  gap: 10,
                }}
              >
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter mindmap title…"
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    border: '2.5px solid #1a1a1a',
                    borderRadius: 10,
                    outline: 'none',
                    background: '#f9f8f4',
                  }}
                />
                <button
                  type="submit"
                  disabled={creating}
                  style={{ ...btn('#6d28d9', '#fff'), opacity: creating ? 0.6 : 1 }}
                  onMouseEnter={!creating ? hoverOn : undefined}
                  onMouseLeave={!creating ? hoverOff : undefined}
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowNewForm(false)} style={{ ...btn('#fff'), padding: '8px 12px' }} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 140,
                  background: '#e5e7eb',
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 14,
                  boxShadow: '4px 4px 0 #1a1a1a',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : mindmaps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                background: '#f3f4f6',
                border: '2.5px solid #1a1a1a',
                borderRadius: '50%',
                boxShadow: '4px 4px 0 #1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-13l6 3m0 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#555' }}>No mindmaps yet!</p>
            <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Create your first one above</p>
          </motion.div>
        ) : (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {mindmaps.map((map, i) => (
              <motion.div
                key={map.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                onClick={() => navigate(`/canvas/${map.id}`)}
                style={{
                  background: CARD_COLORS[i % CARD_COLORS.length],
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 14,
                  boxShadow: '5px 5px 0 #1a1a1a',
                  padding: '18px 20px',
                  cursor: 'pointer',
                  position: 'relative',
                  transform: `rotate(${CARD_ROTATIONS[i % CARD_ROTATIONS.length]}deg)`,
                  transition: 'all 0.15s',
                }}
                whileHover={{ rotate: 0, y: -4, boxShadow: '7px 7px 0 #1a1a1a' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <h3
                    style={{
                      fontWeight: 900,
                      fontSize: 16,
                      color: '#1a1a1a',
                      flex: 1,
                      paddingRight: 8,
                      margin: 0,
                      lineHeight: 1.3,
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {map.title}
                  </h3>
                  {/* Delete icon — always visible */}
                  <button
                    onClick={(e) => deleteMindmap(map.id, e)}
                    disabled={deletingId === map.id}
                    title="Delete mindmap"
                    style={{
                      width: 28,
                      height: 28,
                      border: '2px solid #1a1a1a',
                      borderRadius: 8,
                      background: '#fff',
                      boxShadow: '2px 2px 0 #1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                      opacity: deletingId === map.id ? 0.4 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'inherit'; }}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#555', marginTop: 12, marginBottom: 0 }}>
                  Updated {formatDate(map.updatedAt)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <SettingsModal />
    </div>
  );
}
