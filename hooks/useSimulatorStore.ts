import { create } from 'zustand';
import { Connection, Edge, EdgeChange, Node, NodeChange, addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';

interface SimulatorState {
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
  validateCircuit: () => void;
  resetSimulator: () => void;
  setValidationRules: (rules: { correctWiring: any[] }) => void;
  setInitialState: (nodes: Node[], edges?: Edge[]) => void;
  setMode: (mode: 'play' | 'edit') => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
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
    // Determinar el color del cable según los datos del cable seleccionado o polaridad
    const cableData = (connection as any).data || {};
    let wireColor = cableData.color_hex || '#3b82f6';
    const sourceHandle = connection.sourceHandle || '';
    const targetHandle = connection.targetHandle || '';

    if (!cableData.color_hex) {
      if (sourceHandle.includes('12v') || sourceHandle.includes('24v') || targetHandle.includes('12v') || targetHandle.includes('24v')) {
        wireColor = '#ef4444'; // Rojo (Energía Positiva)
      } else if (sourceHandle.includes('gnd') || sourceHandle.includes('com') || targetHandle.includes('gnd') || targetHandle.includes('com')) {
        wireColor = '#000000'; // Negro (GND/Común)
      }
    }

    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
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

  setInitialState: (nodes, edges = []) => {
    set({
      nodes,
      edges,
      validationResult: null,
    });
  },

  validateCircuit: () => {
    const edges = get().edges;
    const nodes = get().nodes;
    const correctEdges: string[] = [];
    const errors: { edgeId: string; message: string }[] = [];
    const rules = get().validationRules;

    // Si existen reglas dinámicas provistas por el escenario, validar contra ellas
    if (rules && rules.correctWiring && rules.correctWiring.length > 0) {
      edges.forEach((edge) => {
        const sourcePort = edge.sourceHandle || '';
        const targetPort = edge.targetHandle || '';
        const edgeCableTypeId = edge.data?.cable_type_id;

        // Buscar el nodo destino y su hardware_component asociado
        const targetNode = nodes.find(n => n.id === edge.target || n.id === edge.source);
        const targetHardware: any = targetNode?.data?.component || targetNode?.data;
        const requiredCableTypeIds: string[] = targetHardware?.required_cable_type_ids || [];

        // Buscar coincidencia en la configuración de cables correctos por puerto
        const matchedRule = rules.correctWiring.find((rule: any) => 
          (rule.sourcePort === sourcePort && rule.targetPort === targetPort) ||
          (rule.sourcePort === targetPort && rule.targetPort === sourcePort)
        );

        if (!matchedRule) {
          errors.push({
            edgeId: edge.id,
            message: `Conexión de terminal incorrecta entre '${sourcePort}' y '${targetPort}'.`,
          });
          edge.data = { ...edge.data, status: 'incorrect' };
          return;
        }

        // Si la regla o el hardware especifica cable_type_id requerido, comprobarlo
        const ruleRequiredCableTypeId = matchedRule.requiredCableTypeId || matchedRule.cable_type_id;
        
        let isCableValid = true;
        let cableErrorMsg = '';

        if (ruleRequiredCableTypeId && edgeCableTypeId && ruleRequiredCableTypeId !== edgeCableTypeId) {
          isCableValid = false;
          cableErrorMsg = matchedRule.cableErrorMessage || 'Este cable no lleva los conductores o calibre necesarios para este dispositivo.';
        } else if (requiredCableTypeIds.length > 0 && typeof edgeCableTypeId === 'string' && !requiredCableTypeIds.includes(edgeCableTypeId)) {
          isCableValid = false;
          cableErrorMsg = 'Calibre o tipo de cable insuficiente para esta corriente/dispositivo.';
        }

        if (isCableValid) {
          correctEdges.push(edge.id);
          edge.data = { ...edge.data, status: 'correct' };
        } else {
          errors.push({
            edgeId: edge.id,
            message: cableErrorMsg || 'Tipo de cable no válido para este componente.',
          });
          edge.data = { ...edge.data, status: 'incorrect' };
        }
      });

      const isValid = errors.length === 0 && correctEdges.length >= rules.correctWiring.length;

      set({
        edges: [...edges],
        validationResult: {
          isValid,
          correctEdges,
          errors,
        },
      });
      return;
    }

    // LÓGICA DE VALIDACIÓN POR DEFECTO (HISTÓRICA / SANDBOX)
    edges.forEach((edge) => {
      const sourcePort = edge.sourceHandle || '';
      const targetPort = edge.targetHandle || '';
      const edgeCableTypeId = edge.data?.cable_type_id;

      let isPortMatch = false;
      if (sourcePort === 'altronix-12v-out' && targetPort === 'hes5000-pos') {
        isPortMatch = true;
      } else if (sourcePort === 'altronix-gnd-out' && targetPort === 'hes5000-neg') {
        isPortMatch = true;
      }

      if (!isPortMatch) {
        errors.push({
          edgeId: edge.id,
          message: `Conexión incorrecta entre puerto '${sourcePort}' y puerto '${targetPort}'.`,
        });
        edge.data = { ...edge.data, status: 'incorrect' };
        return;
      }

      // Si se especificó un cable y no es un 18 AWG o el id esperado
      const edgeGauge = typeof edge.data?.gauge === 'number' ? edge.data.gauge : Number(edge.data?.gauge) || 0;
      if (edgeCableTypeId && edgeGauge > 0 && edgeGauge > 18 && targetPort.includes('hes5000')) {
        errors.push({
          edgeId: edge.id,
          message: `Calibre insuficiente para esta corriente en el cerradero eléctrico.`,
        });
        edge.data = { ...edge.data, status: 'incorrect' };
        return;
      }

      correctEdges.push(edge.id);
      edge.data = { ...edge.data, status: 'correct' };
    });

    const isValid = errors.length === 0 && correctEdges.length >= 2;

    set({
      edges: [...edges],
      validationResult: {
        isValid,
        correctEdges,
        errors,
      },
    });
  },
}));
