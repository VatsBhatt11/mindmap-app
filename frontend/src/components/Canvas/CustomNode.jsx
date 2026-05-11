import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';

const COMIC_COLORS = [
  '#FFE566', '#FF8FAB', '#A8E6CF', '#89CFF0', '#D4A5FF',
  '#FFB347', '#98FF98', '#FFDAB9', '#C3B1E1', '#AECBFA',
];

const handleBase = {
  width: 10,
  height: 10,
  background: '#1a1a1a',
  border: '2px solid #fff',
  borderRadius: '50%',
};

export default function CustomNode({ id, data, selected }) {
  const setActiveNodeId = useStore((s) => s.setActiveNodeId);
  const updateNodeData = useStore((s) => s.updateNodeData);
  const layoutDir = useStore((s) => s.layoutDir);
  const [showColorPicker, setShowColorPicker] = useState(false);

  function handleDoubleClick(e) {
    e.stopPropagation();
    setActiveNodeId(id);
  }

  function setColor(color) {
    updateNodeData(id, { color });
    setShowColorPicker(false);
  }

  const bg = data.color || '#FFE566';
  const isPreview = data.preview;
  const isLR = layoutDir === 'LR';

  // Invisible style — handle is registered with ReactFlow but not clickable/visible
  const hidden = { opacity: 0, pointerEvents: 'none', width: 1, height: 1 };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isPreview ? 0.55 : 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className="relative group px-4 py-3 min-w-[130px] max-w-[200px]"
      style={{
        backgroundColor: bg,
        border: '2.5px solid #1a1a1a',
        borderRadius: '12px',
        boxShadow: selected
          ? '4px 4px 0 #6d28d9'
          : isPreview
          ? '3px 3px 0 #6d28d9'
          : '4px 4px 0 #1a1a1a',
        borderStyle: isPreview ? 'dashed' : 'solid',
        fontFamily: "'Nunito', sans-serif",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Target handles (always registered, only one visible per direction) ── */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={isLR ? handleBase : hidden}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={isLR ? hidden : handleBase}
      />

      {/* ── Node label ── */}
      <p className="text-sm leading-snug select-none" style={{ fontWeight: 800, color: '#1a1a1a' }}>
        {data.label}
      </p>

      {/* Notes dot */}
      {data.details && data.details !== '<p></p>' && (
        <div
          title="Has notes"
          style={{
            width: 8,
            height: 8,
            background: '#6d28d9',
            border: '1.5px solid #1a1a1a',
            borderRadius: '50%',
            position: 'absolute',
            top: 6,
            right: 6,
          }}
        />
      )}

      {/* ── Color picker toolbar (appears above node on hover/select) ── */}
      {!isPreview && (
        <div className={`absolute -top-9 right-0 flex gap-1 ${selected ? 'flex' : 'hidden group-hover:flex'}`}>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorPicker((v) => !v); }}
              title="Change color"
              style={{
                padding: '2px 8px',
                background: '#fff',
                border: '2px solid #1a1a1a',
                borderRadius: '8px',
                boxShadow: '2px 2px 0 #1a1a1a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: '1.5px solid #1a1a1a',
                  background: bg,
                  display: 'inline-block',
                }}
              />
              Color
            </button>

            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 32,
                  right: 0,
                  background: '#fff',
                  border: '2.5px solid #1a1a1a',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 #1a1a1a',
                  padding: 8,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 5,
                  zIndex: 50,
                }}
              >
                {COMIC_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: c,
                      border: c === bg ? '2.5px solid #6d28d9' : '2px solid #1a1a1a',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={(e) => (e.target.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Source handles (always registered, only one visible per direction) ── */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={isLR ? handleBase : hidden}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={isLR ? hidden : handleBase}
      />
    </motion.div>
  );
}
