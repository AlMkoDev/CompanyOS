# Dependency Graph View — Quick Start Guide

**Feature:** FE-13 — Dependency Graph View  
**Time to Complete:** 5 minutes  
**Prerequisites:** VF-OPS-001 module installed

---

## 🚀 What is the Dependency Graph View?

The Dependency Graph View provides a **network visualization** of your project portfolio, showing how projects depend on each other. It's an alternative to the Gantt chart that focuses specifically on dependency relationships.

### Key Features
- 🟢 **RAG-Colored Nodes** — See project health at a glance (Green/Amber/Red)
- 🔗 **Dependency Edges** — Visual connections showing FTS/STS/FTF relationships
- ✨ **Critical Path** — Automatically highlighted longest dependency chain
- 🔍 **Zoom & Pan** — Explore large portfolios with smooth navigation
- 💬 **Interactive Tooltips** — Hover to see project details
- 🎯 **Smart Selection** — Click to highlight connected dependencies

---

## 📱 Basic Navigation

### Viewing the Graph

1. **Open Project Workspace**
   - Navigate to any project in your portfolio
   - Click the **"Dependency Graph"** tab

2. **Initial View**
   - Projects appear as colored circles (nodes)
   - Dependencies appear as curved lines (edges)
   - Node size indicates progress percentage

3. **Understand the Layout**
   - The graph uses a **force-directed layout** that automatically positions nodes
   - Connected projects tend to cluster together
   - Critical path projects have a golden pulsing glow

---

## 🎮 Controls

### Zoom Controls

| Action | Method | Result |
|--------|--------|--------|
| **Zoom In** | Click `+` button or scroll wheel up | Enlarge view by 10% |
| **Zoom Out** | Click `-` button or scroll wheel down | Shrink view by 10% |
| **Reset Zoom** | Click `↻` button | Return to 100% zoom and center |
| **Fit to Screen** | Click `⛶` button | Set zoom to 150% |

**Current Zoom Level:** Displayed as percentage between zoom buttons (e.g., "100%")

### Pan Controls

| Action | Method | Result |
|--------|--------|--------|
| **Pan Around** | Click and drag on empty space | Move viewport |
| **Re-center** | Double-click on empty space | Center on click point |

### Node Interactions

| Action | Method | Result |
|--------|--------|--------|
| **Select Node** | Click on a project circle | Highlight all connected nodes |
| **View Details** | Hover over a node | Show tooltip with project info |
| **Navigate to Project** | Double-click on a node | Open project detail page (future) |

---

## 🎨 Visual Encodings

### Reading the Graph

#### Node Colors (RAG Status)
- 🟢 **Green** — Project is on track
- 🟠 **Amber** — Project is at risk
- 🔴 **Red** — Project is off track / blocked

#### Edge Colors (Dependency Type)
- **Indigo Solid Line** — **FTS** (Finish to Start): Project B can't start until Project A finishes
- **Violet Dashed Line** — **STS** (Start to Start): Project B can't start until Project A starts
- **Pink Dotted Line** — **FTF** (Finish to Finish): Project B can't finish until Project A finishes

#### Edge Labels
Each edge shows the dependency type and any lag days:
- `FTS` — Standard finish-to-start
- `FTS +5d` — Finish-to-start with 5-day lag

#### Special Effects
- **Golden Pulsing Ring** — This node is on the critical path
- **Thick Border** — This node is currently selected
- **Highlighted Edges** — These edges connect to the selected node

---

## 📊 Understanding Critical Path

### What is Critical Path?

The **critical path** is the longest chain of dependent projects. It determines the minimum time needed to complete the entire portfolio. Any delay in a critical path project delays everything downstream.

### How to Identify Critical Path

1. Look for nodes with a **golden pulsing ring** around them
2. Follow the **gold-colored edges** connecting these nodes
3. This chain represents your critical path

### Example

```
Data Warehouse → Platform Migration → API Gateway → Mobile App
     (Gold)            (Gold)           (Gold)         (Gold)
```

In this example, all four projects are on the critical path. If "Platform Migration" slips by 3 days, "API Gateway" and "Mobile App" will also be delayed.

---

## 🔍 Common Tasks

### Task 1: Find All Dependencies for a Project

1. **Click on the project node** you're interested in
2. **All connected nodes light up** (become more opaque)
3. **Unconnected nodes fade** (become semi-transparent)
4. **Trace the highlighted edges** to understand relationships

**Example:** Clicking on "API Gateway" might highlight:
- Platform Migration (upstream dependency)
- Mobile App v2 (downstream dependency)
- QA Automation (parallel dependency)

### Task 2: Check Project Health

1. **Look at the node color**:
   - Green = Good
   - Amber = Caution
   - Red = Problem

2. **Hover to see details**:
   - Progress percentage
   - Start/end dates
   - Number of upstream/downstream dependencies

**Example Tooltip:**
```
┌─────────────────────────┐
│ API Gateway             │
├─────────────────────────┤
│ Status:        AMBER    │
│ Progress:      45%     │
│ Duration:      Feb 1 → Apr 15 │
│ Dependencies:  ↑1 ↓2   │
└─────────────────────────┘
```

### Task 3: Identify Bottlenecks

Projects with **many connections** are potential bottlenecks:

1. **Look for nodes with many edges** converging
2. **Check the dependency count** in tooltip (↑X ↓Y)
   - High ↑ count = Many prerequisites
   - High ↓ count = Many dependents
3. **These projects need close monitoring**

### Task 4: Understand Delay Impact

If a project is delayed:

1. **Click on the delayed project**
2. **Follow downstream edges** (arrows pointing away)
3. **All highlighted projects** will be impacted
4. **Check if they're on critical path** (golden glow)

---

## 🎯 Best Practices

### 1. Use Alongside Gantt Chart
- **Gantt Chart:** Best for timeline and scheduling details
- **Dependency Graph:** Best for understanding cross-project impacts
- **Switch between tabs** for different perspectives

### 2. Monitor Critical Path Daily
- Critical path projects get **priority attention**
- Any delay here affects **entire portfolio**
- Escalate issues immediately

### 3. Watch for Dense Clusters
- **Tightly connected groups** indicate coupling risk
- Consider **decoupling** if possible
- May need **more frequent sync meetings**

### 4. Check RAG Status Regularly
- **Red nodes** need immediate intervention
- **Amber nodes** need monitoring
- **Green nodes** can usually be left alone

### 5. Use Zoom Strategically
- **Zoom out** (30-50%) for portfolio overview
- **Zoom in** (100-150%) for detailed inspection
- **Reset view** if you get lost

---

## 🧩 Integration with Other Views

### Portfolio Dashboard → Dependency Graph
1. See RAG heatmap in dashboard
2. Notice a problematic project cluster
3. **Open Dependency Graph** to understand why

### Gantt Chart → Dependency Graph
1. See schedule slippage in Gantt
2. **Switch to Dependency Graph** to see impact cascade
3. Identify which downstream projects are affected

### Budget Tracking → Dependency Graph
1. Notice budget overrun in one project
2. **Check Dependency Graph** for downstream cost impacts
3. Adjust budgets for dependent projects proactively

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + +` | Zoom in |
| `Ctrl + -` | Zoom out |
| `Ctrl + 0` | Reset zoom and pan |
| `Esc` | Deselect current node |
| Arrow Keys | Pan viewport (when focused) |

---

## 🎨 Customization (For Administrators)

### Change Node Size
Administrators can adjust default node radius in component settings:
- Default: 45px
- Range: 30-60px
- Larger nodes = easier to click, less detail visible

### Adjust Layout Forces
Advanced users can tune the force-directed layout:
- **Repulsion:** How much nodes push apart (default: 300)
- **Spring Strength:** How tightly connected nodes pull together (default: 0.5)
- **Damping:** How quickly motion stops (default: 0.85)

### Modify Colors
Customize RAG colors to match your organization's branding:
- Access via Admin Settings → Visualization → RAG Colors

---

## 🐛 Troubleshooting

### Problem: Nodes Are Overlapping
**Solution:** 
- Wait 2-3 seconds for layout to settle
- Click "Reset View" to re-run simulation
- Try zooming out to see full graph

### Problem: Can't Read Node Names
**Solution:**
- Hover over node to see full name in tooltip
- Long names are truncated (show first 10 chars + "...")
- Zoom in for better readability

### Problem: Graph Takes Long to Load
**Solution:**
- Large portfolios (>50 projects) may take 1-2 seconds
- This is normal for force-directed layout calculation
- Consider filtering to active projects only

### Problem: Lost My Place in Graph
**Solution:**
- Click the "Reset View" button (↻)
- Or press `Ctrl + 0` on keyboard
- Graph returns to centered 100% zoom view

---

## 📞 Support

### Need Help?
- **Documentation:** See [VF-OPS-001_DEPENDENCY_GRAPH_IMPLEMENTATION.md](./VF-OPS-001_DEPENDENCY_GRAPH_IMPLEMENTATION.md)
- **Video Tutorial:** Coming soon (link will be added here)
- **Contact:** Reach out to your system administrator

### Feedback Welcome!
If you have suggestions for improving the Dependency Graph View, please submit feedback through the Help menu.

---

## 🎉 Quick Reference Card

### At a Glance

**Visual Language:**
- 🟢 Green = On Track
- 🟠 Amber = At Risk
- 🔴 Red = Off Track
- ✨ Golden Glow = Critical Path
- ━━━ Indigo = FTS (Finish to Start)
- ┄┄┄ Violet = STS (Start to Start)
- ⫺⫺⫺ Pink = FTF (Finish to Finish)

**Quick Actions:**
- Click node = Select & highlight connections
- Hover node = Show details tooltip
- Drag canvas = Pan around
- Scroll wheel = Zoom in/out
- Reset button = Start over

**Critical Path:**
- Longest dependency chain
- Determines portfolio duration
- Delays here cascade to everything downstream
- Monitor daily!

---

*Quick Start Guide created: March 15, 2026*  
*Version: 1.0*  
*For: VF-OPS-001 Module — Feature FE-13*
