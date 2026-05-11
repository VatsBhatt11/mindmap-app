import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import useStore from '../../store/useStore';

const TB_BTN = {
  base: 'p-1.5 rounded-lg text-sm font-bold transition-all border-2 border-transparent',
  active: 'bg-violet-100 text-violet-800 border-violet-400',
  inactive: 'text-gray-700 hover:bg-yellow-100 hover:border-gray-400',
};

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}
      className={`${TB_BTN.base} ${active ? TB_BTN.active : TB_BTN.inactive}`}
    >
      {children}
    </button>
  );
}

export default function RichTextModal() {
  const activeNodeId = useStore((s) => s.activeNodeId);
  const setActiveNodeId = useStore((s) => s.setActiveNodeId);
  const nodes = useStore((s) => s.nodes);
  const updateNodeData = useStore((s) => s.updateNodeData);

  const activeNode = nodes.find((n) => n.id === activeNodeId);
  const [titleValue, setTitleValue] = useState('');

  useEffect(() => {
    if (activeNode) setTitleValue(activeNode.data?.label || '');
  }, [activeNodeId]);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: activeNode?.data?.details || '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] text-sm',
        style: "font-family: 'Nunito', sans-serif;",
      },
    },
  });

  useEffect(() => {
    if (editor && activeNode) {
      const current = editor.getHTML();
      const incoming = activeNode.data?.details || '';
      if (current !== incoming) editor.commands.setContent(incoming);
    }
  }, [activeNodeId]);

  function handleClose() {
    if (editor && activeNodeId) {
      updateNodeData(activeNodeId, {
        details: editor.getHTML(),
        label: titleValue.trim() || activeNode?.data?.label || 'Node',
      });
    }
    setActiveNodeId(null);
  }

  const isOpen = !!activeNodeId && !!activeNode;
  const nodeBg = activeNode?.data?.color || '#FFE566';

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
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-2xl flex flex-col"
              style={{
                maxHeight: '82vh',
                background: '#fff',
                border: '3px solid #1a1a1a',
                borderRadius: 18,
                boxShadow: '7px 7px 0 #1a1a1a',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {/* Header strip */}
              <div
                style={{
                  background: nodeBg,
                  borderBottom: '2.5px solid #1a1a1a',
                  borderRadius: '15px 15px 0 0',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#1a1a1a',
                    flexShrink: 0,
                  }}
                />
                <input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  placeholder="Node title..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#1a1a1a',
                    fontFamily: "'Bangers', cursive",
                    letterSpacing: '0.06em',
                  }}
                />
                <button
                  onClick={handleClose}
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
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Editor toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '8px 16px',
                  borderBottom: '2px solid #1a1a1a',
                  flexWrap: 'wrap',
                  background: '#FFFDF0',
                }}
              >
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
                  <strong>B</strong>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Code">
                  <code style={{ fontSize: 11 }}>{`<>`}</code>
                </ToolbarBtn>
                <div style={{ width: 1, height: 20, background: '#1a1a1a', margin: '0 4px' }} />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="H1">
                  H1
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="H2">
                  H2
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="H3">
                  H3
                </ToolbarBtn>
                <div style={{ width: 1, height: 20, background: '#1a1a1a', margin: '0 4px' }} />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Ordered List">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </ToolbarBtn>
                <div style={{ width: 1, height: 20, background: '#1a1a1a', margin: '0 4px' }} />
                <ToolbarBtn onClick={() => editor?.chain().focus().undo().run()} title="Undo">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().redo().run()} title="Redo">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </ToolbarBtn>
              </div>

              {/* Editor body */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ padding: '16px 24px' }}
              >
                <EditorContent editor={editor} />
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '2.5px solid #1a1a1a',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  background: '#FFFDF0',
                  borderRadius: '0 0 15px 15px',
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    padding: '8px 22px',
                    background: '#D4A5FF',
                    border: '2.5px solid #1a1a1a',
                    borderRadius: 10,
                    boxShadow: '3px 3px 0 #1a1a1a',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    color: '#1a1a1a',
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
                  Save & Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
