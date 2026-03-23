'use client';

import React, { useState } from 'react';
import { GanttChart } from '@/components/ppm/gantt/GanttChart';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download } from 'lucide-react';

// ============================================================================
// SAMPLE DATA (Will be replaced by API calls)
// ============================================================================

const sampleProjects = [
  {
    id: 'proj-001',
    name: 'Digital Transformation',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-06-30'),
    ragStatus: 'GREEN' as const,
    progressPercent: 45,
    forecastEndDate: new Date('2026-07-15'), // Slip zone
    baselineStartDate: new Date('2026-01-01'),
    baselineEndDate: new Date('2026-06-15'),
  },
  {
    id: 'proj-002',
    name: 'Cloud Migration Phase 1',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-05-31'),
    ragStatus: 'AMBER' as const,
    progressPercent: 60,
    forecastEndDate: new Date('2026-06-30'),
    baselineStartDate: new Date('2026-02-01'),
    baselineEndDate: new Date('2026-05-31'),
  },
  {
    id: 'proj-003',
    name: 'CRM Implementation',
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-08-31'),
    ragStatus: 'RED' as const,
    progressPercent: 25,
    forecastEndDate: new Date('2026-10-15'),
    baselineStartDate: new Date('2026-03-01'),
    baselineEndDate: new Date('2026-08-31'),
  },
  {
    id: 'proj-004',
    name: 'Security Compliance Upgrade',
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-04-30'),
    ragStatus: 'GREEN' as const,
    progressPercent: 80,
  },
  {
    id: 'proj-005',
    name: 'Mobile App Redesign',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-09-30'),
    ragStatus: 'GREEN' as const,
    progressPercent: 15,
    forecastEndDate: new Date('2026-09-15'),
  },
];

const sampleMilestones = [
  {
    id: 'ms-001',
    projectId: 'proj-001',
    title: 'Requirements Complete',
    date: new Date('2026-02-28'),
    achievedDate: new Date('2026-02-25'),
    overdue: false,
  },
  {
    id: 'ms-002',
    projectId: 'proj-001',
    title: 'Design Sign-off',
    date: new Date('2026-03-31'),
    overdue: false,
  },
  {
    id: 'ms-003',
    projectId: 'proj-002',
    title: 'Infrastructure Setup',
    date: new Date('2026-03-15'),
    overdue: true, // Overdue milestone - will pulse
  },
  {
    id: 'ms-004',
    projectId: 'proj-003',
    title: 'Vendor Selection',
    date: new Date('2026-04-15'),
    overdue: false,
  },
  {
    id: 'ms-005',
    projectId: 'proj-004',
    title: 'Security Audit',
    date: new Date('2026-04-15'),
    overdue: false,
  },
];

const sampleRaidFlags = [
  {
    id: 'raid-001',
    projectId: 'proj-002',
    type: 'RISK' as const,
    severity: 'HIGH' as const,
    loggedDate: new Date('2026-03-10'),
    title: 'Resource shortage in cloud team',
  },
  {
    id: 'raid-002',
    projectId: 'proj-003',
    type: 'ISSUE' as const,
    severity: 'CRITICAL' as const,
    loggedDate: new Date('2026-03-12'),
    title: 'Vendor delivery delayed by 6 weeks',
  },
  {
    id: 'raid-003',
    projectId: 'proj-001',
    type: 'ACTION' as const,
    severity: 'MEDIUM' as const,
    loggedDate: new Date('2026-03-08'),
    title: 'Complete stakeholder interviews',
  },
  {
    id: 'raid-004',
    projectId: 'proj-005',
    type: 'DECISION' as const,
    severity: 'LOW' as const,
    loggedDate: new Date('2026-03-05'),
    title: 'Choose React Native vs Flutter',
  },
];

const sampleDependencies = [
  {
    fromProjectId: 'proj-001',
    toProjectId: 'proj-002',
    type: 'FTS' as const, // Finish-to-start
    lagDays: 0,
  },
  {
    fromProjectId: 'proj-002',
    toProjectId: 'proj-003',
    type: 'FTS' as const,
    lagDays: 7, // 7 days lag
  },
  {
    fromProjectId: 'proj-004',
    toProjectId: 'proj-001',
    type: 'STS' as const, // Start-to-start
    lagDays: 5,
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PortfolioRoadmapPage() {
  const [timeScale, setTimeScale] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');
  const [showBaseline, setShowBaseline] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);

  const handleProjectClick = (projectId: string) => {
    console.log('Navigate to project:', projectId);
    // TODO: Navigate to /projects/[id]
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portfolio Roadmap</h1>
            <p className="text-sm text-slate-600 mt-1">
              Strategic timeline view across all projects with premium signals
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={16} />
              Export PDF
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={16} />
              Filters
            </Button>
            
            <Button size="sm" className="gap-2 bg-brand-navy hover:bg-brand-navy/90">
              <Plus size={16} />
              New Project
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Time Scale:</span>
            
            <div className="flex gap-1">
              {(['WEEK', 'MONTH', 'QUARTER', 'YEAR'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTimeScale(scale)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                    timeScale === scale
                      ? 'bg-brand-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-300" />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBaseline}
              onChange={(e) => setShowBaseline(e.target.checked)}
              className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
            />
            <span className="text-xs font-medium text-slate-600">Show Baseline</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDependencies}
              onChange={(e) => setShowDependencies(e.target.checked)}
              className="rounded border-slate-300 text-brand-navy focus:ring-brand-navy"
            />
            <span className="text-xs font-medium text-slate-600">Show Dependencies</span>
          </label>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="max-w-[1800px] mx-auto">
        <GanttChart
          projects={sampleProjects}
          milestones={sampleMilestones}
          raidFlags={sampleRaidFlags}
          dependencies={sampleDependencies}
          timeScale={timeScale}
          showBaseline={showBaseline}
          showDependencies={showDependencies}
          onProjectClick={handleProjectClick}
        />
      </div>

      {/* Legend */}
      <div className="max-w-[1800px] mx-auto mt-4 p-4 bg-white rounded-lg border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">RAG Status</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-600">Green (On Track)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-600">Amber (At Risk)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-600">Red (Off Track)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Signals</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rotate-45 bg-blue-500" />
                <span className="text-xs text-slate-600">Milestone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-red-500" />
                <span className="text-xs text-slate-600">RAID Flag</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-dashed border-slate-600" />
                <span className="text-xs text-slate-600">Baseline</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Bar Layers</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 bg-gradient-to-r from-white/40 to-white/20 rounded border border-slate-300" />
                <span className="text-xs text-slate-600">Progress Fill (35%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 bg-slate-300 rounded border-2 border-dashed border-slate-500 opacity-50" />
                <span className="text-xs text-slate-600">Slip Zone</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Today</h4>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-red-500 border-t-2 border-dashed border-red-600" />
              <span className="text-xs text-slate-600">Current Date Line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
