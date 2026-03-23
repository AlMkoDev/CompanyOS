'use client';

import React, { useState, useMemo } from 'react';
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
  progressPercent: number; // 0-100
  forecastEndDate?: Date; // For slip zone
  baselineStartDate?: Date; // For ghost bar
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

type HoveredElement =
  | { type: 'project'; data: ProjectBar }
  | { type: 'milestone'; data: Milestone }
  | { type: 'raid'; data: RAIDFlag }
  | { type: 'dependency'; data: DependencyEdge };

interface GanttChartProps {
  projects: ProjectBar[];
  milestones: Milestone[];
  raidFlags: RAIDFlag[];
  dependencies: DependencyEdge[];
  timeScale?: TimeScale;
  showBaseline?: boolean;
  showDependencies?: boolean;
  onProjectClick?: (projectId: string) => void;
}

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

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
// MAIN COMPONENT
// ============================================================================

export function GanttChart({
  projects,
  milestones,
  raidFlags,
  dependencies,
  timeScale = 'MONTH',
  showBaseline = true,
  showDependencies = true,
  onProjectClick,
}: GanttChartProps) {
  // State
  const [zoomLevel, setZoomLevel] = useState<number>(timeScale === 'WEEK' ? 40 : timeScale === 'MONTH' ? 20 : timeScale === 'QUARTER' ? 10 : 5);
  const [hoveredElement, setHoveredElement] = useState<HoveredElement | null>(null);

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
    
    // Add buffer
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

  // Generate time markers based on scale
  const timeMarkers = useMemo(() => {
    const markers: Array<{ date: Date; label: string; x: number }> = [];
    const today = new Date();
    
    if (timeScale === 'WEEK') {
      for (let i = 0; i <= totalDays; i += 7) {
        const date = addDays(timelineStart, i);
        const x = i * zoomLevel;
        const weekNum = Math.ceil((i + 1) / 7);
        markers.push({ date, label: `W${weekNum}`, x });
        
        // Mark today
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
    } else { // YEAR
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

  // Helper to convert date to X position
  const dateToX = (date: Date): number => {
    return getDaysDiff(timelineStart, date) * zoomLevel;
  };

  // Render dependency curves
  const renderDependencies = () => {
    if (!showDependencies) return null;

    return dependencies.map((dep, idx) => {
      const fromProject = projects.find(p => p.id === dep.fromProjectId);
      const toProject = projects.find(p => p.id === dep.toProjectId);
      
      if (!fromProject || !toProject) return null;

      const fromY = projects.findIndex(p => p.id === dep.fromProjectId) * rowHeight + rowHeight / 2 + headerHeight;
      const toY = projects.findIndex(p => p.id === dep.toProjectId) * rowHeight + rowHeight / 2 + headerHeight;
      
      const fromX = dateToX(dep.type === 'FTS' ? fromProject.endDate : fromProject.startDate);
      const toX = dateToX(dep.type === 'FTF' ? toProject.endDate : toProject.startDate);
      
      // Create cubic Bezier curve
      const controlPointOffset = Math.abs(toX - fromX) * 0.5;
      const path = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

      return (
        <path
          key={`dep-${idx}`}
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="4,2"
          markerEnd="url(#arrowhead)"
          opacity={0.6}
        />
      );
    });
  };

  return (
    <div className="w-full h-full overflow-auto bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Project Timeline</h3>
          <span className="text-xs text-slate-500">({projects.length} projects)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev / 1.5, 2))}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} className="text-slate-600" />
          </button>
          
          <span className="text-xs text-slate-600 font-medium px-2">
            {timeScale} VIEW
          </span>
          
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev * 1.5, 100))}
            className="p-2 hover:bg-slate-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Gantt Chart SVG */}
      <svg width="100%" height={chartHeight} className="block">
        <defs>
          {/* Arrow marker for dependencies */}
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

          {/* Gradient for progress bars */}
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>

        {/* Header row background */}
        <rect x={0} y={0} width={chartWidth} height={headerHeight} fill="#f8fafc" stroke="#e2e8f0" />

        {/* Time markers */}
        {timeMarkers.map((marker, idx) => (
          <g key={`marker-${idx}`}>
            <line
              x1={marker.x}
              y1={headerHeight}
              x2={marker.x}
              y2={chartHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={marker.x + 5}
              y={headerHeight - 15}
              fontSize="11"
              fill="#64748b"
              fontWeight="500"
            >
              {marker.label}
            </text>
          </g>
        ))}

        {/* Today line */}
        {(() => {
          const todayX = dateToX(new Date());
          if (todayX >= 0 && todayX <= chartWidth) {
            return (
              <g>
                <line
                  x1={todayX}
                  y1={headerHeight}
                  x2={todayX}
                  y2={chartHeight}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  opacity={0.8}
                />
                <text
                  x={todayX + 5}
                  y={headerHeight - 5}
                  fontSize="10"
                  fill="#ef4444"
                  fontWeight="bold"
                >
                  TODAY
                </text>
              </g>
            );
          }
          return null;
        })()}

        {/* Dependency edges */}
        {renderDependencies()}

        {/* Project bars */}
        {projects.map((project, idx) => {
          const y = idx * rowHeight + headerHeight + 8;
          const barHeight = rowHeight - 16;
          const x = dateToX(project.startDate);
          const width = dateToX(project.endDate) - x;
          const color = getRagColor(project.ragStatus);

          return (
            <g
              key={project.id}
              onMouseEnter={() => setHoveredElement({ type: 'project', data: project })}
              onMouseLeave={() => setHoveredElement(null)}
              onClick={() => onProjectClick?.(project.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Baseline ghost bar (if exists) */}
              {showBaseline && project.baselineStartDate && project.baselineEndDate && (
                <rect
                  x={dateToX(project.baselineStartDate)}
                  y={y - 2}
                  width={dateToX(project.baselineEndDate) - dateToX(project.baselineStartDate)}
                  height={barHeight}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  opacity={0.5}
                />
              )}

              {/* Main bar */}
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={color}
                rx="4"
                opacity={0.85}
                className="transition-opacity hover:opacity-100"
              />

              {/* Progress fill layer (35% opacity as per spec) */}
              <rect
                x={x}
                y={y}
                width={(width * project.progressPercent) / 100}
                height={barHeight}
                fill="url(#progressGradient)"
                rx="4"
                opacity={0.35}
              />

              {/* Slip zone (forecast extension) */}
              {project.forecastEndDate && project.forecastEndDate > project.endDate && (
                <rect
                  x={dateToX(project.endDate)}
                  y={y}
                  width={dateToX(project.forecastEndDate) - dateToX(project.endDate)}
                  height={barHeight}
                  fill={color}
                  rx="4"
                  opacity={0.3}
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
              )}

              {/* Project name */}
              <text
                x={x + 8}
                y={y + barHeight / 2 + 4}
                fontSize="12"
                fill="white"
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {project.name}
              </text>
            </g>
          );
        })}

        {/* Milestone diamonds */}
        {milestones.map((milestone) => {
          const x = dateToX(milestone.date);
          const y = projects.findIndex(p => p.id === milestone.projectId) * rowHeight + headerHeight + rowHeight / 2;
          const size = 10;

          return (
            <g
              key={milestone.id}
              onMouseEnter={() => setHoveredElement({ type: 'milestone', data: milestone })}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {/* Diamond shape */}
              <rect
                x={x - size}
                y={y - size}
                width={size * 2}
                height={size * 2}
                fill={milestone.overdue ? '#ef4444' : '#3b82f6'}
                transform={`rotate(45 ${x} ${y})`}
                opacity={0.9}
                className={milestone.overdue ? 'animate-pulse' : ''}
              />
              
              {/* Milestone label */}
              <text
                x={x + size + 4}
                y={y + 4}
                fontSize="11"
                fill="#475569"
                fontWeight="500"
              >
                {milestone.title}
              </text>
            </g>
          );
        })}

        {/* RAID risk flags */}
        {raidFlags.map((flag) => {
          const x = dateToX(flag.loggedDate);
          const y = projects.findIndex(p => p.id === flag.projectId) * rowHeight + headerHeight + 8;
          const color = getSeverityColor(flag.severity);

          return (
            <g
              key={flag.id}
              onMouseEnter={() => setHoveredElement({ type: 'raid', data: flag })}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {/* Flag pole */}
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + 24}
                stroke="#64748b"
                strokeWidth="2"
              />
              
              {/* Flag triangle */}
              <polygon
                points={`${x},${y} ${x + 12},${y + 6} ${x},${y + 12}`}
                fill={color}
                opacity={0.9}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredElement && (
        <div
          className="fixed z-50 bg-slate-900 text-white px-3 py-2 rounded-md text-xs shadow-lg max-w-sm"
          style={{
            left: '50%',
            top: '80px',
            transform: 'translateX(-50%)',
          }}
        >
          {hoveredElement.type === 'project' && (
            <>
              <div className="font-semibold">{hoveredElement.data.name}</div>
              <div className="text-slate-300 mt-1">
                Status: {hoveredElement.data.ragStatus} • Progress: {hoveredElement.data.progressPercent}%
              </div>
              <div className="text-slate-300">
                {formatDate(hoveredElement.data.startDate)} → {formatDate(hoveredElement.data.endDate)}
              </div>
              {hoveredElement.data.forecastEndDate && (
                <div className="text-amber-300 mt-1">
                  Forecast: {formatDate(hoveredElement.data.forecastEndDate)}
                </div>
              )}
            </>
          )}
          {hoveredElement.type === 'milestone' && (
            <>
              <div className="font-semibold">🎯 {hoveredElement.data.title}</div>
              <div className="text-slate-300 mt-1">
                Due: {formatDate(hoveredElement.data.date)}
                {hoveredElement.data.overdue && <span className="text-red-400 ml-2">⚠ OVERDUE</span>}
              </div>
            </>
          )}
          {hoveredElement.type === 'raid' && (
            <>
              <div className="font-semibold">
                🚩 {hoveredElement.data.type} - {hoveredElement.data.severity}
              </div>
              <div className="text-slate-300 mt-1">{hoveredElement.data.title}</div>
              <div className="text-slate-300">Logged: {formatDate(hoveredElement.data.loggedDate)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
