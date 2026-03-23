# 🚀 Quick Start - Drag-to-Reschedule Gantt (FE-05)

## Try Drag-to-Reschedule Now!

### Prerequisites

The drag-to-reschedule component wraps the existing Gantt chart. You'll need to use the enhanced component instead of the base GanttChart.

---

## What You Get

### Main Features:
✅ **Drag Handles** - Grab any project bar and move it  
✅ **Automatic Cascade** - Downstream projects adjust automatically  
✅ **Constraint Warnings** - Modal shows violations before confirming  
✅ **Undo System** - 30-second window to reverse changes  
✅ **Keyboard Shortcut** - Ctrl+Z / Cmd+Z to undo  
✅ **Visual Feedback** - Smooth animations during drag  

---

## How to Use It

### **Step 1: Open the Gantt Chart**

Navigate to your portfolio roadmap page where you're using the Gantt chart:

```typescript
// Replace this:
import { GanttChart } from '@/components/ppm/gantt/GanttChart';

// With this:
import { GanttChartWithDrag } from '@/components/ppm/gantt/GanttChartWithDrag';
```

### **Step 2: Add the onProjectReschedule Handler**

```typescript
<GanttChartWithDrag
  projects={projects}
  milestones={milestones}
  raidFlags={raidFlags}
  dependencies={dependencies}
  timeScale="MONTH"
  onProjectReschedule={(projectId, newStart, newEnd, cascade) => {
    console.log('Project rescheduled:', projectId);
    console.log('New dates:', newStart, '→', newEnd);
    console.log('Cascade impact:', cascade.length, 'projects affected');
    
    // TODO: Call API to persist changes
  }}
/>
```

### **Step 3: Drag a Project**

1. **Hover over any project bar**
   - Cursor changes to a grab hand 👆
   - Bar highlights slightly

2. **Click and hold**
   - Bar enters dragging state
   - Follows your cursor horizontally

3. **Drag left or right**
   - Watch dates update in real-time
   - See dependency lines stretch

4. **Release to drop**
   - System calculates cascade impact
   - Shows warning modal if issues detected

---

## Sample Scenarios to Try

### **Scenario 1: Simple Move (No Dependencies)**

**Try This:**
1. Find a project with no downstream dependencies
2. Drag it 1 week later
3. Release

**What Happens:**
- No modal appears (no violations)
- Change applies immediately
- Undo notification pops up (30s countdown)
- Press Ctrl+Z to undo

### **Scenario 2: Cascade with Dependencies**

**Setup:**
Use the sample data which includes these dependencies:
- Digital Transformation → Cloud Migration (FTS)
- Cloud Migration → CRM Implementation (FTS + 7 days lag)

**Try This:**
1. Drag "Digital Transformation" 2 weeks later
2. Release

**What Happens:**
- Modal appears showing:
  - 📋 Cascade Impact: 2 projects affected
  - Cloud Migration shifts by 2 weeks
  - CRM Implementation shifts by 2 weeks
- Click "Confirm Reschedule"
- All three projects update

### **Scenario 3: Baseline Violation**

**Setup:**
Projects with approved baseline dates

**Try This:**
1. Drag a baselined project significantly later
2. Release

**What Happens:**
- Modal appears with:
  - 🔴 BASELINE ERROR: New end date is X days past approved baseline
  - "Confirm" button is disabled
- Must click "Cancel" and choose different dates

---

## Understanding Dependency Types

### **FTS (Finish-to-Start)** - Most Common
```
Project A must finish before Project B can start

Example:
Design (Jan 1-10) → Development (Jan 11-20)

Drag Design to Jan 5-14
→ Development auto-shifts to Jan 15-24
```

### **STS (Start-to-Start) with Lag**
```
Project B starts N days after Project A starts

Example:
Testing starts 5 days after Development starts

Drag Development start from Jan 1 to Jan 10
→ Testing start shifts from Jan 6 to Jan 15
```

### **FTF (Finish-to-Finish) with Lag**
```
Project B finishes N days after Project A finishes

Example:
Documentation finishes 2 days after Development finishes

Drag Development finish from Jan 10 to Jan 20
→ Documentation finish shifts from Jan 12 to Jan 22
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** (Windows) | Undo last reschedule |
| **Cmd+Z** (Mac) | Undo last reschedule |
| **Click + Drag** | Move project bar |
| **Esc** | Cancel current drag |

---

## Visual Indicators

### **Cursor States:**
- 👆 **Grab Hand** - Can drag
- ✊ **Grabbing Hand** - Currently dragging
- ➡️ **Default** - Cannot drag (not hovering bar)

### **Bar States:**
- **Normal** - Solid color, RAG status
- **Hover** - Slightly brighter, scale 1.02x
- **Dragging** - Opacity 50%, scale 1.05x, follows cursor
- **Preview** - Ghost bars show potential new position

### **Modal Alerts:**
- 🔴 **ERROR** (Red) - Blocking issue, cannot proceed
- 🟡 **WARNING** (Amber) - Proceed with caution
- 📋 **INFO** (Blue) - Informational message

---

## Undo System

### **How It Works:**

1. **After Successful Reschedule:**
   - Notification appears bottom-right
   - Shows: "Project rescheduled successfully"
   - Countdown timer: 30, 29, 28...
   - "Undo" button visible

2. **To Undo:**
   - Click **"Undo"** button
   - OR press **Ctrl+Z** / **Cmd+Z**

3. **Result:**
   - Project reverts to original dates
   - Notification disappears
   - Undo removed from stack

4. **After 30 Seconds:**
   - Notification auto-disappears
   - Undo no longer available
   - Change is permanent

### **Multiple Undos:**

You can undo multiple times (stack-based):
- Undo 1st change → Previous state restored
- Undo 2nd change → State before that restored
- Maximum depth: Limited by memory

**Note:** Undo only reverts the changed project, NOT the cascade (by design).

---

## Tips for Use

### **Best Practices:**

1. **Review Cascade Before Dropping:**
   - Watch the preview as you drag
   - See which projects will be affected
   - Plan your moves carefully

2. **Check for Baselines:**
   - Projects with baselines have stricter constraints
   - Small changes = warnings
   - Large changes = blocked

3. **Use Undo Wisely:**
   - 30-second window is generous
   - Test different scenarios
   - Undo to compare options

4. **Watch for Gate Dates:**
   - Upcoming gates block certain date ranges
   - Plan around gate reviews
   - Reschedule early to avoid conflicts

### **Common Scenarios:**

**Scenario: Resource Conflict**
```
Problem: Two projects need same team at same time
Solution: Drag one project later, cascade handles dependencies
```

**Scenario: Deadline Moved Up**
```
Problem: Executive moves launch date earlier
Solution: Drag final milestone earlier, upstream projects adjust
```

**Scenario: Risk Mitigation**
```
Problem: High-risk task needs buffer time
Solution: Drag successor tasks later to add slack
```

---

## Troubleshooting

### **Can't Drag Project?**
- Check if project has edit permissions
- Ensure you're hovering the bar (not milestone/flag)
- Verify drag-to-reschedule is enabled

### **Modal Won't Appear?**
- Check browser console for errors
- Verify violations exist (try larger date change)
- Ensure modal z-index isn't conflicted

### **Undo Not Working?**
- Check if 30s window expired
- Verify keyboard shortcut not blocked by browser
- Try clicking Undo button instead

### **Cascade Not Calculating?**
- Verify dependencies exist in data
- Check dependency types are valid (FTS/STS/FTF)
- Ensure downstream projects still exist

---

## Next Steps

### **Backend Integration Needed:**

1. **Implement BE-11 API:**
   ```typescript
   POST /api/projects/:projectId/reschedule
   // Returns: { success, cascade: [], violations: [] }
   ```

2. **Persist Changes:**
   - Update project dates in database
   - Cascade updates to all affected projects
   - Send notifications to PMs

3. **Enhance Validation:**
   - Real gate review checks
   - Actual resource capacity
   - Multi-company coordination

### **Future Enhancements:**
- Email notifications to affected stakeholders
- Approval workflow for large cascades
- What-if scenario mode
- Advanced resource leveling
- Audit trail reports
- Multi-user collaboration awareness

---

## Related Documentation

- [Full Drag-to-Reschedule Implementation](c:/CompanyOS/VF-OPS-001_DRAG_TO_RESCHEDULE_IMPLEMENTATION.md)
- [Gantt Chart Guide](c:/CompanyOS/VF-OPS-001_QUICK_START.md)
- [Budget Tracking Guide](c:/CompanyOS/VF-OPS-001_BUDGET_QUICK_START.md)
- [Overall Project Status](c:/CompanyOS/VF-OPS-001_THREE_FEATURES_DELIVERED.md)

---

**Happy rescheduling!** 📅✨
