import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';
import cytoscape, { type Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { getCytoscapeStyles } from '../styles/theme.js';

let fcoseRegistered = false;
if (!fcoseRegistered) {
  cytoscape.use(fcose);
  fcoseRegistered = true;
}

export function useCytoscape(
  containerRef: RefObject<HTMLDivElement | null>,
  darkMode = true,
): {
  cy: Core | null;
  cyRef: MutableRefObject<Core | null>;
  runLayout: (options?: Record<string, unknown>) => void;
} {
  const cyRef = useRef<Core | null>(null);
  const [cy, setCy] = useState<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const instance = cytoscape({
      container: containerRef.current,
      style: getCytoscapeStyles(darkMode),
      minZoom: 0.05,
      maxZoom: 5,
      wheelSensitivity: 0.12,
      boxSelectionEnabled: false,
      autoungrabify: false,
      selectionType: 'single',
    });

    cyRef.current = instance;
    setCy(instance);

    return () => {
      instance.destroy();
      cyRef.current = null;
      setCy(null);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }

    cyRef.current.style(getCytoscapeStyles(darkMode));
    cyRef.current.style().update();
  }, [darkMode]);

  const runLayout = useCallback((options?: Record<string, unknown>) => {
    if (!cyRef.current) {
      return;
    }

    const layout = cyRef.current.layout({
      name: 'fcose',
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 50,
      nodeSeparation: 75,
      idealEdgeLength: 150,
      nodeRepulsion: () => 8000,
      edgeElasticity: () => 0.45,
      gravity: 0.25,
      gravityRange: 3.8,
      ...(options ?? {}),
    } as cytoscape.LayoutOptions);
    layout.run();
  }, []);

  return { cy, cyRef, runLayout };
}
