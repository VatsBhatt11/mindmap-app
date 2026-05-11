import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

export default function SettingsModal() {
  const isOpen = useStore((s) => s.isSettingsOpen);
  const setIsOpen = useStore((s) => s.setIsSettingsOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                background: '#fff',
                border: '3px solid #1a1a1a',
                borderRadius: 18,
                boxShadow: '6px 6px 0 #1a1a1a',
                fontFamily: "'Nunito', sans-serif",
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: '#FFE566',
                  borderBottom: '2.5px solid #1a1a1a',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: 22,
                    letterSpacing: '0.07em',
                    color: '#1a1a1a',
                    margin: 0,
                  }}
                >
                  Settings
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: 30,
                    height: 30,
                    border: '2px solid #1a1a1a',
                    borderRadius: 8,
                    background: '#fff',
                    boxShadow: '2px 2px 0 #1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: 24 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#666',
                    textAlign: 'center',
                    padding: '16px 0',
                    background: '#FFFDF0',
                    border: '2px dashed #1a1a1a',
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  AI model and credentials are managed server-side.
                </p>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: '#D4A5FF',
                    border: '2.5px solid #1a1a1a',
                    borderRadius: 10,
                    boxShadow: '3px 3px 0 #1a1a1a',
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: 'pointer',
                    color: '#1a1a1a',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-1px,-1px)';
                    e.currentTarget.style.boxShadow = '4px 4px 0 #1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '3px 3px 0 #1a1a1a';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
