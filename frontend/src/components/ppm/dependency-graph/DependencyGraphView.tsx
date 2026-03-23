'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RefreshCcw, Maximize, Info } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RAGStatus = 'GREEN' | 'AMBER' | 'RED';

interface ProjectNode {
  id: string;
  name: string;
  ragStatus: RAGStatus;
  progressPercent: number;
  startDate: Date;
  endDate: Date;
  isCritical?: boolean;
  upstreamCount?: number;
  downstreamCount?: number;
}

interface DependencyLink {
  fromProjectId: string;
  toProjectId: string;
  type: 'FTS' | 'STS' | 'FTF';
  lagDays: number;
}

interface GraphPosition {
  x: number;
  y: number;
}

interface NodePosition extends GraphPosition {
  id: string;
  vx?: number; // Velocity for force simulation
  vy?: number;
}

interface ContainerSize {
  width: number;
  height: number;
}

interface DependencyGraphViewProps {
  projects: ProjectNode[];
  dependencies: DependencyLink[];
  onNodeClick?: (projectId: string) => void;
  onNodeHover?: (projectId: string | null) => void;
  showCriticalPath?: boolean;
  autoLayout?: 'force' | 'hierarchical';
}

// ============================================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================================

const NODE_RADIUS = 45;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;
const FORCE_STRENGTH = 0.5;
const REPULSION_STRENGTH = 300;
const DAMPING = 0.85;
const SIMULATION_STEPS = 50;

const RAG_COLORS = {
  GREEN: '#10b981',
  AMBER: '#f59e0b',
  RED: '#ef4444',
};

const DEPENDENCY_COLORS = {
  FTS: '#6366f1', // Indigo - Finish to Start
  STS: '#8b5cf6', // Violet - Start to Start
  FTF: '#ec4899', // Pink - Finish to Finish
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAngle = (p1: GraphPosition, p2: GraphPosition): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
};

// ============================================================================
// FORCE-DIRECTED LAYOUT ENGINE
// ============================================================================

class ForceDirectedLayout {
  private nodes: NodePosition[];
  private links: DependencyLink[];
  private width: number;
  private height: number;

  constructor(
    nodes: NodePosition[],
    links: DependencyLink[],
    width: number,
    height: number
  ) {
    this.nodes = nodes;
    this.links = links;
    this.width = width;
    this.height = height;
  }

  simulate(steps: number = SIMULATION_STEPS): NodePosition[] {
    // Initialize velocities
    this.nodes.forEach(node => {
      node.vx = 0;
      node.vy = 0;
    });

    // Run simulation steps
    for (let i = 0; i < steps; i++) {
      this.applyRepulsion();
      this.applySprings();
      this.applyCenterForce();
      this.updatePositions();
    }

    return this.nodes;
  }

  private applyRepulsion(): void {
    // Node repulsion (Coulomb's law)
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (distance < 500) {
          const force = REPULSION_STRENGTH / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx = (nodeA.vx ?? 0) - fx;
          nodeA.vy = (nodeA.vy ?? 0) - fy;
          nodeB.vx = (nodeB.vx ?? 0) + fx;
          nodeB.vy = (nodeB.vy ?? 0) + fy;
        }
      }
    }
  }

  private applySprings(): void {
    // Spring forces for connected nodes (Hooke's law)
    const idealLength = 200;

    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.fromProjectId);
      const target = this.nodes.find(n => n.id === link.toProjectId);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = (distance - idealLength) * FORCE_STRENGTH * 0.01;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      source.vx = (source.vx ?? 0) + fx;
      source.vy = (source.vy ?? 0) + fy;
      target.vx = (target.vx ?? 0) - fx;
      target.vy = (target.vy ?? 0) - fy;
    });
  }

  private applyCenterForce(): void {
    // Center gravity force
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.nodes.forEach(node => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = distance * 0.005;
      node.vx = (node.vx ?? 0) + (dx / distance) * force;
      node.vy = (node.vy ?? 0) + (dy / distance) * force;
    });
  }

  private updatePositions(): void {
    // Update positions based on velocities
    this.nodes.forEach(node => {
      node.x += node.vx! * DAMPING;
      node.y += node.vy! * DAMPING;

      // Boundary constraints
      const margin = NODE_RADIUS + 20;
      node.x = Math.max(margin, Math.min(this.width - margin, node.x));
      node.y = Math.max(margin, Math.min(this.height - margin, node.y));

      // Reset velocities
      node.vx = 0;
      node.vy = 0;
    });
  }
}

// ============================================================================
// CRITICAL PATH CALCULATION
// ============================================================================

function calculateCriticalPath(
  projects: ProjectNode[],
  dependencies: DependencyLink[]
): Set<string> {
  const criticalNodes = new Set<string>();
  
  // Find projects with no upstream dependencies (start nodes)
  const allTargets = new Set(dependencies.map(d => d.toProjectId));
  const startNodes = projects.filter(p => !allTargets.has(p.id));

  // Find longest path using DFS
  function findLongestPath(nodeId: string, visited: Set<string>): string[] {
    if (visited.has(nodeId)) return [];
    
    visited.add(nodeId);
    
    // Find all downstream dependencies
    const downstream = dependencies
      .filter(d => d.fromProjectId === nodeId)
      .map(d => d.toProjectId);

    if (downstream.length === 0) {
      return [nodeId]; // End of path
    }

    let longestPath: string[] = [];
    downstream.forEach(nextId => {
      const path = findLongestPath(nextId, new Set(visited));
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    });

    return [nodeId, ...longestPath];
  }

  // Calculate longest path from each start node
  let overallLongestPath: string[] = [];
  startNodes.forEach(startNode => {
    const path = findLongestPath(startNode.id, new Set());
    if (path.length > overallLongestPath.length) {
      overallLongestPath = path;
    }
  });

  // Mark nodes in critical path
  overallLongestPath.forEach(nodeId => criticalNodes.add(nodeId));

  return criticalNodes;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface NodeCircleProps {
  node: ProjectNode;
  position: GraphPosition;
  isSelected: boolean;
  isHighlighted: boolean;
  isCritical: boolean;
  onClick: () => void;
  onHover: (isHovering: boolean) => void;
}

const NodeCircle: React.FC<NodeCircleProps> = ({
  node,
  position,
  isSelected,
  isHighlighted,
  isCritical,
  onClick,
  onHover,
}) => {
  const color = RAG_COLORS[node.ragStatus];
  const scale = isSelected ? 1.2 : isHighlighted ? 1.1 : 1;
  const opacity = isHighlighted || isSelected ? 1 : 0.85;

  return (
    <motion.g
      transform={`translate(${position.x},${position.y})`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale, opacity }}
      whileHover={{ scale: 1.15, cursor: 'pointer' }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Critical path glow */}
      {isCritical && (
        <motion.circle
          r={NODE_RADIUS + 8}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={3}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.3 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* Outer ring */}
      <circle
        r={NODE_RADIUS}
        fill={color}
        stroke={isSelected ? '#1e293b' : '#475569'}
        strokeWidth={isSelected ? 4 : 2}
        opacity={opacity}
      />

      {/* Progress ring */}
      <circle
        r={NODE_RADIUS - 8}
        fill="none"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={6}
        strokeDasharray={`${(node.progressPercent / 100) * 2 * Math.PI * (NODE_RADIUS - 8)} ${
          (1 - node.progressPercent / 100) * 2 * Math.PI * (NODE_RADIUS - 8)
        }`}
        transform="rotate(-90)"
      />

      {/* Project name */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="600"
        fill="white"
        style={{ pointerEvents: 'none' }}
      >
        {node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
      </text>

      {/* Status indicator */}
      <circle cx={NODE_RADIUS - 12} cy={-NODE_RADIUS + 12} r={6} fill="white" />
      <circle
        cx={NODE_RADIUS - 12}
        cy={-NODE_RADIUS + 12}
        r={4}
        fill={node.ragStatus === 'GREEN' ? '#10b981' : node.ragStatus === 'AMBER' ? '#f59e0b' : '#ef4444'}
      />
    </motion.g>
  );
};

interface DependencyEdgeProps {
  link: DependencyLink;
  sourcePos: GraphPosition;
  targetPos: GraphPosition;
  isHighlighted: boolean;
  isCritical: boolean;
}

const DependencyEdge: React.FC<DependencyEdgeProps> = ({
  link,
  sourcePos,
  targetPos,
  isHighlighted,
  isCritical,
}) => {
  const angle = getAngle(sourcePos, targetPos);
  const arrowLength = 12;
  const sourceOffset = NODE_RADIUS + 2;
  const targetOffset = NODE_RADIUS + arrowLength;

  const startX = sourcePos.x + Math.cos(angle) * sourceOffset;
  const startY = sourcePos.y + Math.sin(angle) * sourceOffset;
  const endX = targetPos.x - Math.cos(angle) * targetOffset;
  const endY = targetPos.y - Math.sin(angle) * targetOffset;

  const color = isCritical ? '#fbbf24' : DEPENDENCY_COLORS[link.type];
  const strokeWidth = isHighlighted || isCritical ? 3 : 2;
  const opacity = isHighlighted ? 0.9 : 0.5;

  // Calculate control points for curved edge
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const curveOffset = 30;
  const controlX = midX + Math.cos(angle + Math.PI / 2) * curveOffset;
  const controlY = midY + Math.sin(angle + Math.PI / 2) * curveOffset;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.5 }}
    >
      {/* Edge path */}
      <motion.path
        d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={link.type === 'FTS' ? '0' : link.type === 'STS' ? '5,3' : '2,2'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Arrowhead */}
      <motion.polygon
        points={`${endX},${endY} ${endX - arrowLength},${endY - arrowLength / 2} ${endX - arrowLength},${endY + arrowLength / 2}`}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      />

      {/* Dependency type label */}
      <motion.text
        x={(startX + endX) / 2}
        y={(startY + endY) / 2 - 8}
        fontSize="9"
        fontWeight="600"
        fill={color}
        textAnchor="middle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.5 }}
      >
        {link.type}
        {link.lagDays > 0 && ` +${link.lagDays}d`}
      </motion.text>
    </motion.g>
  );
};

interface TooltipProps {
  node: ProjectNode;
  position: GraphPosition;
}

const NodeTooltip: React.FC<TooltipProps> = ({ node, position }) => {
  return (
    <motion.div
      className="absolute z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs"
      style={{
        left: position.x,
        top: position.y - 80,
        transform: 'translateX(-50%)',
      }}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    >
      <div className="font-semibold text-sm mb-2">{node.name}</div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Status:</span>
          <span
            className={`font-medium ${
              node.ragStatus === 'GREEN'
                ? 'text-green-400'
                : node.ragStatus === 'AMBER'
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {node.ragStatus}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Progress:</span>
          <span className="font-medium">{node.progressPercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Duration:</span>
          <span className="font-medium">
            {node.startDate.toLocaleDateString()} → {node.endDate.toLocaleDateString()}
          </span>
        </div>
        {node.upstreamCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Dependencies:</span>
            <span className="font-medium">
              ↑{node.upstreamCount} ↓{node.downstreamCount}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DependencyGraphView({
  projects,
  dependencies,
  onNodeClick,
  onNodeHover,
  showCriticalPath = true,
}: DependencyGraphViewProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateContainerSize = () => {
      if (!containerRef.current) return;

      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate critical path
  const criticalPathNodes = useMemo(() => {
    if (!showCriticalPath) return new Set<string>();
    return calculateCriticalPath(projects, dependencies);
  }, [projects, dependencies, showCriticalPath]);

  // Calculate dependency counts for each node
  const projectsWithCounts = useMemo(() => {
    return projects.map(project => {
      const upstreamCount = dependencies.filter(
        d => d.toProjectId === project.id
      ).length;
      const downstreamCount = dependencies.filter(
        d => d.fromProjectId === project.id
      ).length;

      return {
        ...project,
        upstreamCount,
        downstreamCount,
        isCritical: criticalPathNodes.has(project.id),
      };
    });
  }, [projects, dependencies, criticalPathNodes]);

  // Calculate node positions using force-directed layout
  const nodePositions = useMemo(() => {
    const { width, height } = containerSize;
    if (!width || !height) return [];

    // Initialize positions
    const initialPositions: NodePosition[] = projects.map((project, idx) => {
      // Spread nodes in a circular pattern initially
      const angle = (2 * Math.PI * idx) / projects.length;
      const radius = Math.min(width, height) * 0.3;
      return {
        id: project.id,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });

    // Run force simulation
    const layout = new ForceDirectedLayout(initialPositions, dependencies, width, height);
    return layout.simulate(SIMULATION_STEPS);
  }, [projects, dependencies, containerSize]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  }, []);

  // Handle pan interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  }, []);

  // Add wheel event listener
  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Get highlighted nodes (connected to selected node)
  const highlightedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    const connected = new Set<string>([selectedNodeId]);
    const queue = [selectedNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      // Find connected nodes
      const connectedIds = [
        ...dependencies.filter(d => d.fromProjectId === currentId).map(d => d.toProjectId),
        ...dependencies.filter(d => d.toProjectId === currentId).map(d => d.fromProjectId),
      ];

      connectedIds.forEach(id => {
        if (!connected.has(id)) {
          connected.add(id);
          queue.push(id);
        }
      });
    }

    return connected;
  }, [selectedNodeId, dependencies]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Dependency Graph</h3>
          <span className="text-xs text-slate-500">
            {projects.length} projects • {dependencies.length} dependencies
          </span>
          {criticalPathNodes.size > 0 && (
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Info size={12} />
              Critical Path: {criticalPathNodes.size} nodes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-slate-600" />
          </motion.button>

          <span className="text-xs text-slate-600 font-medium px-2 min-w-15 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-slate-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetView}
            className="p-2 hover:bg-slate-200 rounded transition-colors ml-2"
            title="Reset View"
          >
            <RefreshCcw size={16} className="text-slate-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(1.5)}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Fit to Screen"
          >
            <Maximize size={16} className="text-slate-600" />
          </motion.button>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="flex items-center gap-4 px-4 py-2 border-b border-slate-200 bg-white text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">RAG:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Green</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Amber</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Red</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Type:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-indigo-500" />
            <span>FTS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-violet-500" style={{ borderStyle: 'dashed' }} />
            <span>STS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-0.5 bg-pink-500" style={{ borderStyle: 'dotted' }} />
            <span>FTF</span>
          </div>
        </div>
        {showCriticalPath && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-6 h-0.5 bg-amber-400" style={{ borderWidth: 2 }} />
            <span className="font-medium text-amber-600">Critical Path</span>
          </div>
        )}
      </motion.div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <AnimatePresence>
          {hoveredNodeId && (
            <NodeTooltip
              node={projectsWithCounts.find(p => p.id === hoveredNodeId)!}
              position={nodePositions.find(p => p.id === hoveredNodeId)!}
            />
          )}
        </AnimatePresence>

        <motion.svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Dependency edges */}
          {dependencies.map((link, idx) => {
            const sourcePos = nodePositions.find(p => p.id === link.fromProjectId);
            const targetPos = nodePositions.find(p => p.id === link.toProjectId);

            if (!sourcePos || !targetPos) return null;

            const isCritical =
              criticalPathNodes.has(link.fromProjectId) &&
              criticalPathNodes.has(link.toProjectId);
            const isHighlighted =
              highlightedNodes.has(link.fromProjectId) &&
              highlightedNodes.has(link.toProjectId);

            return (
              <DependencyEdge
                key={`link-${idx}`}
                link={link}
                sourcePos={sourcePos}
                targetPos={targetPos}
                isHighlighted={!!isHighlighted}
                isCritical={!!isCritical}
              />
            );
          })}

          {/* Project nodes */}
          {nodePositions.map((pos) => {
            const project = projectsWithCounts.find(p => p.id === pos.id)!;
            const isSelected = selectedNodeId === pos.id;
            const isHighlighted = highlightedNodes.has(pos.id);

            return (
              <NodeCircle
                key={project.id}
                node={project}
                position={pos}
                isSelected={isSelected}
                isHighlighted={!!isHighlighted}
                isCritical={!!project.isCritical}
                onClick={() => {
                  setSelectedNodeId(selectedNodeId === project.id ? null : project.id);
                  onNodeClick?.(project.id);
                }}
                onHover={(isHovering) => {
                  setHoveredNodeId(isHovering ? project.id : null);
                  onNodeHover?.(isHovering ? project.id : null);
                }}
              />
            );
          })}
        </motion.svg>

        {/* Instructions overlay */}
        <motion.div
          className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm border border-slate-200 text-xs text-slate-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>💡 Drag to pan • Scroll to zoom • Click node for details</div>
        </motion.div>
      </div>
    </div>
  );
}
