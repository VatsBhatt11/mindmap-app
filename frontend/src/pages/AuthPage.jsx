import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useStore from '../store/useStore';

export default function AuthPage() {
  const user = useStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFDF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Nunito', sans-serif",
        backgroundImage: 'radial-gradient(circle, #d4c9a8 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#7c3aed',
              border: '3px solid #1a1a1a',
              boxShadow: '5px 5px 0 #1a1a1a',
              marginBottom: 12,
            }}
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 42,
              letterSpacing: '0.1em',
              color: '#1a1a1a',
              margin: 0,
              lineHeight: 1,
            }}
          >
            MindFlow
          </h1>
          <p style={{ color: '#666', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
            AI-powered mindmapping canvas
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            border: '3px solid #1a1a1a',
            borderRadius: 18,
            boxShadow: '6px 6px 0 #1a1a1a',
            padding: 32,
          }}
        >
          <h2
            style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 24,
              letterSpacing: '0.07em',
              color: '#1a1a1a',
              margin: '0 0 22px',
            }}
          >
            Sign In
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label
                style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 10,
                  background: '#FFFDF0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: '3px 3px 0 #1a1a1a',
                  transition: 'box-shadow 0.1s, border-color 0.1s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.boxShadow = '3px 3px 0 #7c3aed';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1a1a1a';
                  e.target.style.boxShadow = '3px 3px 0 #1a1a1a';
                }}
              />
            </div>

            <div>
              <label
                style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 10,
                  background: '#FFFDF0',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: '3px 3px 0 #1a1a1a',
                  transition: 'box-shadow 0.1s, border-color 0.1s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c3aed';
                  e.target.style.boxShadow = '3px 3px 0 #7c3aed';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#1a1a1a';
                  e.target.style.boxShadow = '3px 3px 0 #1a1a1a';
                }}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: '#FF8FAB',
                  border: '2px solid #1a1a1a',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  boxShadow: '2px 2px 0 #1a1a1a',
                }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 0',
                background: loading ? '#d1d5db' : '#D4A5FF',
                border: '2.5px solid #1a1a1a',
                borderRadius: 10,
                boxShadow: loading ? '2px 2px 0 #999' : '4px 4px 0 #1a1a1a',
                fontSize: 16,
                fontWeight: 900,
                fontFamily: "'Nunito', sans-serif",
                letterSpacing: '0.04em',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#1a1a1a',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translate(-1px,-1px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0 #1a1a1a';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = loading ? '2px 2px 0 #999' : '4px 4px 0 #1a1a1a';
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
