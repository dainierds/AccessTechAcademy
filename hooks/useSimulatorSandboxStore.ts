import { create } from 'zustand';
import { Connection, Edge, EdgeChange, Node, NodeChange, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';

export interface SandboxRuleCondition {
  sourceNodeId: string;
  sourceHandleId: string;
  relation: 'CONNECTED' | 'DISCONNECTED';
  targetNodeId: string;
  targetHandleId: string;
}

export interface SandboxRuleAction {
  targetNodeId: string;
  actionType: 'CHANGE_COLOR' | 'PLAY_SOUND' | 'SET_VOLTAGE' | 'DISPLAY_ALERT';
  colorHex?: string;      // e.g. '#ef4444' (Red), '#10b981' (Green), '#f59e0b' (Amber)
  soundType?: 'beep' | 'click' | 'alarm';
  voltageValue?: string;  // e.g. '12.24 V', '24.00 V', '0.00 V'
  alertText?: string;
}

export interface SandboxRule {
  id: string;
  name: string;
  isActive: boolean;
  condition: SandboxRuleCondition;
  action: SandboxRuleAction;
}

export interface MultimeterState {
  isPowered: boolean;
  mode: 'DCV' | 'ACV' | 'RES' | 'CONT';
  displayValue: string; // e.g. '0.00 V' or '12.24 V'
  redProbeNodeId?: string;
  redProbeHandleId?: string;
  blackProbeNodeId?: string;
  blackProbeHandleId?: string;
}

export function playSandboxSound(soundType: 'beep' | 'click' | 'alarm' = 'beep') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (soundType === 'beep') {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (soundType === 'click') {
      osc.type = 'triangle';
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (soundType === 'alarm') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio context ignored
  }
}

interface SimulatorSandboxState {
  nodes: Node[];
  edges: Edge[];
  rules: SandboxRule[];
  multimeter: MultimeterState;
  nodeColorOverrides: Record<string, string>; // nodeId -> colorHex
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

  // Sandbox Rules & Multimeter Actions
  addRule: (rule: Omit<SandboxRule, 'id'>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  evaluateRules: () => void;
  updateMultimeter: (patch: Partial<MultimeterState>) => void;
}

export const useSimulatorSandboxStore = create<SimulatorSandboxState>((set, get) => ({
  nodes: [],
  edges: [],
  rules: [],
  nodeColorOverrides: {},
  multimeter: {
    isPowered: true,
    mode: 'DCV',
    displayValue: '0.00 V',
  },
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
    get().evaluateRules();
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
  },

  addRule: (ruleData) => {
    const newRule: SandboxRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    set({ rules: [...get().rules, newRule] });
    get().evaluateRules();
  },

  removeRule: (ruleId) => {
    set({ rules: get().rules.filter((r) => r.id !== ruleId) });
    get().evaluateRules();
  },

  toggleRule: (ruleId) => {
    set({
      rules: get().rules.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r)),
    });
    get().evaluateRules();
  },

  updateMultimeter: (patch) => {
    set({ multimeter: { ...get().multimeter, ...patch } });
  },

  evaluateRules: () => {
    const { rules, edges } = get();
    const activeRules = rules.filter((r) => r.isActive);
    const newColorOverrides: Record<string, string> = {};
    let newVoltage: string | null = null;

    activeRules.forEach((rule) => {
      const { condition, action } = rule;
      const isConnected = edges.some((edge) => {
        const direct =
          (edge.source === condition.sourceNodeId &&
            edge.sourceHandle === condition.sourceHandleId &&
            edge.target === condition.targetNodeId &&
            edge.targetHandle === condition.targetHandleId) ||
          (edge.source === condition.sourceNodeId &&
            !condition.sourceHandleId &&
            edge.target === condition.targetNodeId);

        const reverse =
          (edge.source === condition.targetNodeId &&
            edge.sourceHandle === condition.targetHandleId &&
            edge.target === condition.sourceNodeId &&
            edge.targetHandle === condition.sourceHandleId) ||
          (edge.source === condition.targetNodeId &&
            !condition.targetHandleId &&
            edge.target === condition.sourceNodeId);

        return direct || reverse;
      });

      const conditionMet =
        (condition.relation === 'CONNECTED' && isConnected) ||
        (condition.relation === 'DISCONNECTED' && !isConnected);

      if (conditionMet) {
        if (action.actionType === 'CHANGE_COLOR' && action.colorHex) {
          newColorOverrides[action.targetNodeId] = action.colorHex;
        } else if (action.actionType === 'PLAY_SOUND' && action.soundType) {
          playSandboxSound(action.soundType);
        } else if (action.actionType === 'SET_VOLTAGE' && action.voltageValue) {
          newVoltage = action.voltageValue;
        }
      }
    });

    set({
      nodeColorOverrides: newColorOverrides,
      multimeter: newVoltage
        ? { ...get().multimeter, displayValue: newVoltage }
        : get().multimeter,
    });
  },
}));
