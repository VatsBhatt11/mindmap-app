import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import api from '../lib/api';
import useStore from '../store/useStore';
import MindmapCanvas from '../components/Canvas/MindmapCanvas';
import ChatBot from '../components/ChatBot/ChatBot';
import SettingsModal from '../components/Settings/SettingsModal';
import RichTextModal from '../components/RichText/RichTextModal';
import Toolbar from '../components/Toolbar/Toolbar';
import { getLayoutedElements } from '../components/Canvas/useAutoLayout';

export default function CanvasPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setCurrentMindmap = useStore((s) => s.setCurrentMindmap);
  const setNodes = useStore((s) => s.setNodes);
  const setEdges = useStore((s) => s.setEdges);
  const currentMindmap = useStore((s) => s.currentMindmap);
  // BYOK disabled — no client-side API key needed
  // const groqApiKey = useStore((s) => s.groqApiKey);
  // const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // BYOK disabled — no longer prompt for API key on first visit
    // if (!groqApiKey) setIsSettingsOpen(true);

    loadMindmap();

    // Cleanup store on unmount
    return () => {
      setCurrentMindmap(null);
      setNodes([]);
      setEdges([]);
    };
  }, [id]);

  async function loadMindmap() {
    try {
      const { data } = await api.get(`/api/mindmaps/${id}`);
      setCurrentMindmap(data);

      const graph = data.graphData || {};
      const rawNodes = graph.nodes || [];
      const rawEdges = graph.edges || [];

      if (rawNodes.length > 0) {
        // Re-apply layout in case positions are stale
        const { nodes: ln, edges: le } = getLayoutedElements(rawNodes, rawEdges);
        setNodes(ln);
        setEdges(le);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/dashboard');
      } else {
        setError('Failed to load mindmap. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async ({ nodes, edges }) => {
    try {
      await api.put(`/api/mindmaps/${id}`, { graphData: { nodes, edges } });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFDF0', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, border: '4px solid #ede9fe', borderTop: '4px solid #6d28d9', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <p style={{ fontSize: 13, fontWeight: 800, color: '#666' }}>Loading mindmap…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFDF0', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e11d48', fontWeight: 800, marginBottom: 16 }}>{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
        <Toolbar mindmapTitle={currentMindmap?.title} />

        <div className="flex flex-1 overflow-hidden mt-[57px]">
          <div className="flex-1 overflow-hidden">
            <MindmapCanvas onSave={handleSave} />
          </div>
          <ChatBot />
        </div>

        <RichTextModal />
        <SettingsModal />
      </div>
    </ReactFlowProvider>
  );
}
