'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, type PanInfo } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RAGStatus = 'GREEN' | 'AMBER' | 'RED';
type TimeScale = 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

interface ProjectBar {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  ragStatus: RAGStatus;
  progressPercent: number;
  forecastEndDate?: Date;
  baselineStartDate?: Date;
  baselineEndDate?: Date;
}

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  date: Date;
  achievedDate?: Date;
  overdue: boolean;
}

interface RAIDFlag {
  id: string;
  projectId: string;
  type: 'RISK' | 'ACTION' | 'ISSUE' | 'DECISION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  loggedDate: Date;
  title: string;
}

interface DependencyEdge {
  fromProjectId: string;
  toProjectId: string;
  type: 'FTS' | 'STS' | 'FTF';
  lagDays: number;
}

interface GanttChartAnimatedProps {
  projects: ProjectBar[];
  milestones: Milestone[];
  raidFlags: RAIDFlag[];
  dependencies: DependencyEdge[];
  timeScale?: TimeScale;
  showBaseline?: boolean;
  showDependencies?: boolean;
  onProjectClick?: (projectId: string) => void;
  onProjectDragStart?: (projectId: string) => void;
  onProjectDrag?: (projectId: string, newStart: Date, newEnd: Date) => void;
  onProjectDragEnd?: (projectId: string, newStart: Date, newEnd: Date) => void;
}

// ============================================================================
// ANIMATION CONFIGURATIONS
// ============================================================================

const BAR_ANIMATIONS = {
  // Normal state
  normal: {
    scale: 1,
    opacity: 0.85,
    rotate: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  // Hover state
  hover: {
    scale: 1.02,
    opacity: 0.95,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  // Dragging state
  dragging: {
    scale: 1.05,
    opacity: 0.5,
    rotate: 2,
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    cursor: 'grabbing',
    transition: {
      duration: 0.1,
    },
  },
  // Preview ghost state
  ghost: {
    opacity: 0.3,
    scale: 1,
  },
};

const MILESTONE_ANIMATIONS = {
  normal: {
    scale: 1,
    opacity: 0.9,
  },
  hover: {
    scale: 1.2,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 8,
    },
  },
  overdue: {
    scale: [1, 1.1, 1],
    opacity: [0.9, 1, 0.9],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDaysDiff = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getRagColor = (status: RAGStatus): string => {
  switch (status) {
    case 'GREEN': return '#10b981';
    case 'AMBER': return '#f59e0b';
    case 'RED': return '#ef4444';
    default: return '#6b7280';
  }
};

const getSeverityColor = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): string => {
  switch (severity) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW': return '#10b981';
    default: return '#6b7280';
  }
};

// ============================================================================
// ANIMATED PROJECT BAR COMPONENT
// ============================================================================

interface AnimatedProjectBarProps {
  project: ProjectBar;
  x: number;
  y: number;
  width: number;
  height: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDrag: (newX: number) => void;
  onDragEnd: (newStart: Date, newEnd: Date) => void;
  onClick: () => void;
}

const AnimatedProjectBar = React.forwardRef<SVGGElement, AnimatedProjectBarProps>(
  ({ project, x, y, width, height, isDragging, onDragStart, onDrag, onDragEnd, onClick }, ref) => {
    const controls = useAnimation();
    const color = getRagColor(project.ragStatus);

    const handleDragStart = () => {
      controls.start('dragging');
      onDragStart();
    };

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const newX = x + info.offset.x;
      onDrag(newX);
    };

    const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Calculate date change based on drag distance
      const pixelsPerDay = 20; // This should come from parent
      const daysDragged = Math.round(info.offset.x / pixelsPerDay);
      
      if (daysDragged !== 0) {
        const newStart = addDays(project.startDate, daysDragged);
        const newEnd = addDays(project.endDate, daysDragged);
        onDragEnd(newStart, newEnd);
      }
      
      await controls.start('normal');
    };

    return (
      <motion.g
        ref={ref}
        initial="normal"
        animate={isDragging ? 'dragging' : controls}
        variants={BAR_ANIMATIONS}
        drag={isDragging ? 'x' : false}
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          originX: 0.5,
          originY: 0.5,
        }}
      >
        {/* Main bar */}
        <motion.rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={color}
          rx={4}
          initial={{ opacity: 0.85 }}
          whileHover={{ opacity: 0.95 }}
        />

        {/* Progress fill layer (35% opacity) */}
        <motion.rect
          x={x}
          y={y}
          width={(width * project.progressPercent) / 100}
          height={height}
          fill="url(#progressGradient)"
          rx={4}
          opacity={0.35}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* Slip zone (forecast extension) */}
        {project.forecastEndDate && project.forecastEndDate > project.endDate && (
          <motion.rect
            x={x + width}
            y={y}
            width={getDaysDiff(project.endDate, project.forecastEndDate) * 20}
            height={height}
            fill={color}
            rx={4}
            opacity={0.3}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4,2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Project name */}
        <motion.text
          x={x + 8}
          y={y + height / 2 + 4}
          fontSize="12"
          fill="white"
          fontWeight="600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ pointerEvents: 'none' }}
        >
          {project.name}
        </motion.text>

        {/* Drag handles (visual indicators) */}
        {!isDragging && (
          <>
            <motion.circle
              cx={x + 4}
              cy={y + height / 2}
              r={3}
              fill="rgba(255,255,255,0.6)"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, scale: 1.2 }}
            />
            <motion.circle
              cx={x + width - 4}
              cy={y + height / 2}
              r={3}
              fill="rgba(255,255,255,0.6)"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1, scale: 1.2 }}
            />
          </>
        )}
      </motion.g>
    );
  }
);

AnimatedProjectBar.displayName = 'AnimatedProjectBar';

// ============================================================================
// ANIMATED MILESTONE COMPONENT
// ============================================================================

interface AnimatedMilestoneProps {
  milestone: Milestone;
  x: number;
  y: number;
  size: number;
}

const AnimatedMilestone = ({ milestone, x, y, size }: AnimatedMilestoneProps) => {
  return (
    <motion.g
      initial="normal"
      animate={milestone.overdue ? 'overdue' : 'normal'}
      variants={MILESTONE_ANIMATIONS}
      whileHover="hover"
    >
      {/* Diamond shape */}
      <motion.rect
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
        fill={milestone.overdue ? '#ef4444' : '#3b82f6'}
        transform={`rotate(45 ${x} ${y})`}
        opacity={0.9}
        whileHover={{ scale: 1.2, rotate: 48 }}
      />
      
      {/* Pulsing ring for overdue milestones */}
      {milestone.overdue && (
        <motion.circle
          cx={x}
          cy={y}
          r={size * 2}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
        />
      )}

      {/* Milestone label */}
      <motion.text
        x={x + size + 4}
        y={y + 4}
        fontSize="11"
        fill="#475569"
        fontWeight="500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {milestone.title}
      </motion.text>
    </motion.g>
  );
};

// ============================================================================
// ANIMATED RAID FLAG COMPONENT
// ============================================================================

interface AnimatedRAIDFlagProps {
  flag: RAIDFlag;
  x: number;
  y: number;
}

const AnimatedRAIDFlag = ({ flag, x, y }: AnimatedRAIDFlagProps) => {
  const color = getSeverityColor(flag.severity);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.9, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 10, delay: 0.1 }}
      whileHover={{ scale: 1.2, y: -2 }}
    >
      {/* Flag pole */}
      <motion.line
        x1={x}
        y1={y}
        x2={x}
        y2={y + 24}
        stroke="#64748b"
        strokeWidth={2}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Flag triangle */}
      <motion.polygon
        points={`${x},${y} ${x + 12},${y + 6} ${x},${y + 12}`}
        fill={color}
        opacity={0.9}
        whileHover={{ points: `${x},${y} ${x + 14},${y + 7} ${x},${y + 14}` }}
      />

      {/* Severity indicator pulse */}
      {flag.severity === 'CRITICAL' && (
        <motion.circle
          cx={x + 6}
          cy={y + 6}
          r={8}
          fill="none"
          stroke={color}
          strokeWidth={1}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
    </motion.g>
  );
};

// ============================================================================
// ANIMATED DEPENDENCY EDGE COMPONENT
// ============================================================================

interface AnimatedDependencyEdgeProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isVisible: boolean;
}

const AnimatedDependencyEdge = ({ fromX, fromY, toX, toY, isVisible }: AnimatedDependencyEdgeProps) => {
  const controlPointOffset = Math.abs(toX - fromX) * 0.5;
  const path = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.path
          key={`dep-${fromX}-${toX}`}
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="4,2"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          exit={{ pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GanttChartAnimated({
  projects,
  milestones,
  raidFlags,
  dependencies,
  timeScale = 'MONTH',
  showDependencies = true,
  onProjectClick,
  onProjectDragStart,
  onProjectDrag,
  onProjectDragEnd,
}: GanttChartAnimatedProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(timeScale === 'WEEK' ? 40 : timeScale === 'MONTH' ? 20 : timeScale === 'QUARTER' ? 10 : 5);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);

  // Calculate timeline bounds
  const { totalDays, timelineStart, timelineEnd } = useMemo(() => {
    if (projects.length === 0) {
      const now = new Date();
      return {
        minDate: now,
        maxDate: addDays(now, 90),
        totalDays: 90,
        timelineStart: now,
        timelineEnd: addDays(now, 90),
      };
    }

    const startDates = projects.map(p => p.startDate);
    const endDates = projects.map(p => p.endDate);
    
    const min = new Date(Math.min(...startDates.map(d => d.getTime())));
    const max = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    const timelineStart = addDays(min, -7);
    const timelineEnd = addDays(max, 7);
    const totalDays = getDaysDiff(timelineStart, timelineEnd);

    return { totalDays, timelineStart, timelineEnd };
  }, [projects]);

  // Calculate dimensions
  const chartWidth = totalDays * zoomLevel;
  const rowHeight = 56;
  const headerHeight = 60;
  const chartHeight = projects.length * rowHeight + headerHeight;

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: Array<{ date: Date; label: string; x: number }> = [];
    const today = new Date();
    
    if (timeScale === 'WEEK') {
      for (let i = 0; i <= totalDays; i += 7) {
        const date = addDays(timelineStart, i);
        const x = i * zoomLevel;
        const weekNum = Math.ceil((i + 1) / 7);
        markers.push({ date, label: `W${weekNum}`, x });
        
        if (date <= today && addDays(date, 7) >= today) {
          markers.push({
            date: today,
            label: 'TODAY',
            x: getDaysDiff(timelineStart, today) * zoomLevel,
          });
        }
      }
    } else if (timeScale === 'MONTH') {
      const current = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
      while (current <= timelineEnd) {
        const x = getDaysDiff(timelineStart, current) * zoomLevel;
        const label = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        markers.push({ date: current, label, x });
        current.setMonth(current.getMonth() + 1);
      }
    } else if (timeScale === 'QUARTER') {
      const current = new Date(timelineStart.getFullYear(), Math.floor(timelineStart.getMonth() / 3) * 3, 1);
      while (current <= timelineEnd) {
        const x = getDaysDiff(timelineStart, current) * zoomLevel;
        const label = `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`;
        markers.push({ date: current, label, x });
        current.setMonth(current.getMonth() + 3);
      }
    } else {
      const current = new Date(timelineStart.getFullYear(), 0, 1);
      while (current <= timelineEnd) {
        const x = getDaysDiff(timelineStart, current) * zoomLevel;
        const label = current.getFullYear().toString();
        markers.push({ date: current, label, x });
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    return markers;
  }, [timelineStart, timelineEnd, totalDays, zoomLevel, timeScale]);

  const dateToX = (date: Date): number => {
    return getDaysDiff(timelineStart, date) * zoomLevel;
  };

  const handleDragStart = (projectId: string) => {
    setDraggingProjectId(projectId);
    onProjectDragStart?.(projectId);
  };

  const handleDrag = (projectId: string, newX: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const originalX = dateToX(project.startDate);
    const pixelsPerDay = zoomLevel;
    const daysDragged = Math.round((newX - originalX) / pixelsPerDay);
    
    const newStart = addDays(project.startDate, daysDragged);
    const newEnd = addDays(project.endDate, daysDragged);
    
    onProjectDrag?.(projectId, newStart, newEnd);
  };

  return (
    <div className="w-full h-full overflow-auto bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Toolbar */}
      <motion.div 
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Project Timeline</h3>
          <span className="text-xs text-slate-500">({projects.length} projects)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoomLevel(prev => Math.max(prev / 1.5, 2))}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
          >
            <ZoomOut size={16} className="text-slate-600" />
          </motion.button>
          
          <span className="text-xs text-slate-600 font-medium px-2">
            {timeScale} VIEW
          </span>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoomLevel(prev => Math.min(prev * 1.5, 100))}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
          >
            <ZoomIn size={16} className="text-slate-600" />
          </motion.button>
        </div>
      </motion.div>

      {/* Gantt Chart SVG */}
      <svg width="100%" height={chartHeight} className="block">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>

          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>

        {/* Header row background */}
        <motion.rect
          x={0}
          y={0}
          width={chartWidth}
          height={headerHeight}
          fill="#f8fafc"
          stroke="#e2e8f0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Time markers */}
        {timeMarkers.map((marker, idx) => (
          <motion.g
            key={`marker-${idx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
          >
            <motion.line
              x1={marker.x}
              y1={headerHeight}
              x2={marker.x}
              y2={chartHeight}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="2,2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.02 }}
            />
            <motion.text
              x={marker.x + 5}
              y={headerHeight - 15}
              fontSize="11"
              fill="#64748b"
              fontWeight="500"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 + 0.2 }}
            >
              {marker.label}
            </motion.text>
          </motion.g>
        ))}

        {/* Today line */}
        {(() => {
          const todayX = dateToX(new Date());
          if (todayX >= 0 && todayX <= chartWidth) {
            return (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.line
                  x1={todayX}
                  y1={headerHeight}
                  x2={todayX}
                  y2={chartHeight}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4,2"
                  opacity={0.8}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.text
                  x={todayX + 5}
                  y={headerHeight - 5}
                  fontSize="10"
                  fill="#ef4444"
                  fontWeight="bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  TODAY
                </motion.text>
              </motion.g>
            );
          }
          return null;
        })()}

        {/* Dependency edges */}
        {showDependencies && dependencies.map((dep) => {
          const fromProject = projects.find(p => p.id === dep.fromProjectId);
          const toProject = projects.find(p => p.id === dep.toProjectId);
          
          if (!fromProject || !toProject) return null;

          const fromY = projects.findIndex(p => p.id === dep.fromProjectId) * rowHeight + rowHeight / 2 + headerHeight;
          const toY = projects.findIndex(p => p.id === dep.toProjectId) * rowHeight + rowHeight / 2 + headerHeight;
          
          const fromX = dateToX(dep.type === 'FTS' ? fromProject.endDate : fromProject.startDate);
          const toX = dateToX(dep.type === 'FTF' ? toProject.endDate : toProject.startDate);
          
          return (
            <AnimatedDependencyEdge
              key={`dep-${dep.fromProjectId}-${dep.toProjectId}`}
              fromX={fromX}
              fromY={fromY}
              toX={toX}
              toY={toY}
              isVisible={true}
            />
          );
        })}

        {/* Project bars */}
        {projects.map((project, idx) => {
          const y = idx * rowHeight + headerHeight + 8;
          const barHeight = rowHeight - 16;
          const x = dateToX(project.startDate);
          const width = dateToX(project.endDate) - x;
          const isDragging = draggingProjectId === project.id;

          return (
            <AnimatedProjectBar
              key={project.id}
              project={project}
              x={x}
              y={y}
              width={width}
              height={barHeight}
              isDragging={isDragging}
              onDragStart={() => handleDragStart(project.id)}
              onDrag={(newX) => handleDrag(project.id, newX)}
              onDragEnd={(newStart, newEnd) => {
                setDraggingProjectId(null);
                onProjectDragEnd?.(project.id, newStart, newEnd);
              }}
              onClick={() => onProjectClick?.(project.id)}
            />
          );
        })}

        {/* Milestones */}
        {milestones.map((milestone) => {
          const x = dateToX(milestone.date);
          const y = projects.findIndex(p => p.id === milestone.projectId) * rowHeight + headerHeight + rowHeight / 2;
          const size = 10;

          return (
            <AnimatedMilestone
              key={milestone.id}
              milestone={milestone}
              x={x}
              y={y}
              size={size}
            />
          );
        })}

        {/* RAID flags */}
        {raidFlags.map((flag) => {
          const x = dateToX(flag.loggedDate);
          const y = projects.findIndex(p => p.id === flag.projectId) * rowHeight + headerHeight + 8;

          return (
            <AnimatedRAIDFlag
              key={flag.id}
              flag={flag}
              x={x}
              y={y}
            />
          );
        })}
      </svg>
    </div>
  );
}
