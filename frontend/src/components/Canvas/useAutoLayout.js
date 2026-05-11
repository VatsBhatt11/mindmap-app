import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

// Handle IDs used in CustomNode — must stay in sync
export const HANDLE_IDS = {
  LR: { source: 'right', target: 'left' },
  TB: { source: 'bottom', target: 'top' },
};

export function getLayoutedElements(nodes, edges, direction = 'LR') {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50, marginx: 40, marginy: 40 });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = graph.node(node.id);
    return {
      ...node,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    };
  });

  // Stamp direction-specific handle IDs onto edges so ReactFlow routes
  // from/to the correct physical handle (right→left for LR, bottom→top for TB)
  const { source: sourceHandle, target: targetHandle } = HANDLE_IDS[direction] ?? HANDLE_IDS.LR;
  const layoutedEdges = edges.map((e) => ({
    ...e,
    sourceHandle,
    targetHandle,
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

export function aiResponseToFlow(aiData, existingNodes = [], selectedNode = null, direction = 'LR') {
  const idOffset = existingNodes.length;

  const idMap = {};
  aiData.nodes.forEach((n, i) => {
    idMap[n.id] = `ai-${idOffset + i}-${Date.now()}`;
  });

  const nodes = aiData.nodes.map((n) => ({
    id: idMap[n.id],
    type: 'customNode',
    data: { label: n.label, details: n.details || '', color: n.color || '#f3f4f6', preview: true },
    position: { x: 0, y: 0 },
    style: { opacity: 0.55 },
  }));

  const { source: srcHandle, target: tgtHandle } = HANDLE_IDS[direction] ?? HANDLE_IDS.LR;

  const edges = aiData.edges.map((e, i) => ({
    id: `ai-edge-${idOffset + i}-${Date.now()}`,
    source: idMap[e.source] || e.source,
    target: idMap[e.target] || e.target,
    animated: true,
    style: { strokeDasharray: '6 3', stroke: '#8b5cf6' },
    sourceHandle: srcHandle,
    targetHandle: tgtHandle,
  }));

  if (selectedNode && nodes.length > 0) {
    edges.unshift({
      id: `ai-edge-root-${Date.now()}`,
      source: selectedNode.id,
      target: nodes[0].id,
      animated: true,
      style: { strokeDasharray: '6 3', stroke: '#8b5cf6' },
      sourceHandle: srcHandle,
      targetHandle: tgtHandle,
    });
  }

  const { nodes: laid, edges: laidEdges } = getLayoutedElements(nodes, edges, direction);

  if (selectedNode) {
    const dx = (selectedNode.position?.x ?? 0) + 300;
    const dy = selectedNode.position?.y ?? 0;
    const minX = Math.min(...laid.map((n) => n.position.x));
    const minY = Math.min(...laid.map((n) => n.position.y));
    laid.forEach((n) => {
      n.position.x = n.position.x - minX + dx;
      n.position.y = n.position.y - minY + dy;
    });
  }

  return { nodes: laid, edges: laidEdges };
}
