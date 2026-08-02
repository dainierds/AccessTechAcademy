import { create } from 'zustand';
import { Connection, Edge, EdgeChange, Node, NodeChange, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';

interface SimulatorSandboxState {
  nodes: Node[];
  edges: Edge[];
  validationResult: {
    isValid: boolean;
    correctEdges: string[];
    errors: { edgeId: string; message: string }[];
  } | null;
  mode: 'play' | 'edit';
  validationRules: { correctWiring: any[] } | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  validateCircuit: () => void;
  resetSimulator: () => void;
  setValidationRules: (rules: { correctWiring: any[] }) => void;
  setInitialState: (nodes: Node[], edges?: Edge[]) => void;
  setMode: (mode: 'play' | 'edit') => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export const useSimulatorSandboxStore = create<SimulatorSandboxState>((set, get) => ({
  nodes: [],
  edges: [],
  validationResult: null,
  validationRules: null,
  mode: 'play',

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    const cableData = (connection as any).data || {};
    let wireColor = cableData.color_hex || '#3b82f6';
    const sourceHandle = connection.sourceHandle || '';
    const targetHandle = connection.targetHandle || '';

    if (!cableData.color_hex) {
      if (sourceHandle.includes('12v') || sourceHandle.includes('24v') || targetHandle.includes('12v') || targetHandle.includes('24v')) {
        wireColor = '#ef4444';
      } else if (sourceHandle.includes('gnd') || sourceHandle.includes('com') || targetHandle.includes('gnd') || targetHandle.includes('com')) {
        wireColor = '#000000';
      }
    }

    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'wire',
      data: {
        ...cableData,
        cable_type_id: cableData.cable_type_id,
        color_hex: cableData.color_hex || wireColor,
        gauge: cableData.gauge,
        conductor: cableData.conductor,
        color: wireColor,
        status: 'pending'
      },
    } as Edge;

    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  removeNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  removeEdge: (edgeId) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
    });
  },

  resetSimulator: () => {
    set({
      nodes: [],
      edges: [],
      validationResult: null,
      validationRules: null,
      mode: 'play',
    });
  },

  setValidationRules: (rules) => {
    set({ validationRules: rules });
  },

  setInitialState: (nodes, edges = []) => {
    set({
      nodes,
      edges,
      validationResult: null,
    });
  },

  setMode: (mode) => {
    set({ mode });
  },

  updateNodePosition: (id, x, y) => {
    set({
      nodes: get().nodes.map((node) => 
        node.id === id ? { ...node, position: { x, y } } : node
      ),
    });
  },

  validateCircuit: () => {
    const { edges, validationRules } = get();
    
    if (!validationRules || !validationRules.correctWiring || validationRules.correctWiring.length === 0) {
      set({
        validationResult: {
          isValid: edges.length > 0,
          correctEdges: edges.map(e => e.id),
          errors: edges.length === 0 ? [{ edgeId: 'none', message: 'No hay conexiones en el circuito.' }] : []
        }
      });
      return;
    }

    const errors: { edgeId: string; message: string }[] = [];
    const correctEdges: string[] = [];

    validationRules.correctWiring.forEach((rule: any) => {
      const matchingEdge = edges.find((edge) => {
        const matchDirect = 
          (edge.source === rule.sourceNode && edge.sourceHandle === rule.sourceHandle &&
           edge.target === rule.targetNode && edge.targetHandle === rule.targetHandle);
        const matchReverse = 
          (edge.source === rule.targetNode && edge.sourceHandle === rule.targetHandle &&
           edge.target === rule.sourceNode && edge.targetHandle === rule.sourceHandle);
        return matchDirect || matchReverse;
      });

      if (matchingEdge) {
        correctEdges.push(matchingEdge.id);
      } else {
        errors.push({
          edgeId: `missing-${rule.sourceNode}-${rule.targetNode}`,
          message: `Falta conexión entre ${rule.sourceNode} (${rule.sourceHandle}) y ${rule.targetNode} (${rule.targetHandle}).`
        });
      }
    });

    const isValid = errors.length === 0 && correctEdges.length === validationRules.correctWiring.length;

    set({
      validationResult: {
        isValid,
        correctEdges,
        errors
      }
    });
  }
}));
