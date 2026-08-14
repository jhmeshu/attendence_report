# **Attendance Dashboard — Development Plan**

## **Phase 1 — Project Foundation**

**Goal:** Create the application shell.

Build:

* React \+ Vite  
* Tailwind CSS  
* Lucide icons  
* Chart library  
* Responsive layout  
* Sidebar/navigation  
* Header  
* Main dashboard container  
* Light modern UI  
* Your brand color `#008DFF`  
* Reusable Card, Button, Badge, Modal, Table components

**Do NOT build CSV processing yet.**

### **Result**

A static dashboard UI with dummy data.

---

# **Phase 2 — CSV Upload & Validation**

**Goal:** Allow management to upload the 3 monthly CSV files.

Upload interface:

┌─────────────────────────────────┐  
│      Upload Attendance Data     │  
│                                 │  
│  \+ Upload CSV Files             │  
│                                 │  
│  ✓ May 2026                     │  
│  ✓ June 2026                    │  
│  ✓ July 2026                    │  
│                                 │  
│       \[ Process Attendance \]    │  
└─────────────────────────────────┘

Implement:

* Multiple CSV upload  
* CSV parsing  
* Required-column validation  
* Duplicate detection  
* Date detection  
* Month detection  
* Consecutive-month validation  
* Employee ID validation  
* Helpful error messages

### **Important**

Do **not** trust filenames.

Determine the month from the `Date` column.

### **Result**

3 CSVs  
  ↓  
Validation  
  ↓  
Normalized data  
---

# **Phase 3 — Attendance Data Engine**

**Goal:** Build the calculation engine before connecting it to the UI.

Create a clean internal attendance model.

Implement:

### **Time rules**

Clock In \<= 10:00 AM  
→ On Time

Clock In \> 10:00 AM  
→ Late

Clock Out \< 7:00 PM  
→ Early Leave

### **Department rules**

bKash \+ no Clock In  
→ No Attendance Record

Exabyting office \+ no Clock In  
→ Absent

### **Weekend**

Friday \+ Saturday  
→ Weekend

If someone works on a weekend:

→ Weekend Work

### **Output**

Every attendance record should have calculated fields such as:

attendanceStatus  
arrivalStatus  
departureStatus  
isLate  
isEarlyLeave  
isWeekend  
isWeekendWork

### **Result**

A reliable calculation engine independent of the UI.

---

# **Phase 4 — Monthly Employee Calculations**

**Goal:** Convert daily records into employee-level monthly statistics.

For every employee/month calculate:

* Scheduled working days  
* Present days  
* Absent days  
* No attendance record days  
* Late days  
* Early leave days  
* Weekend work days  
* Attendance %  
* Late %  
* Early leave %  
* Average late minutes  
* Total late minutes  
* Total working hours  
* Average working hours

### **Example**

John Smith

July 2026

Present:          19  
Absent:            2  
No Record:         1  
Late:              11  
Early Leave:       5

Attendance:       90.48%  
Late:             52.38%  
Early Leave:      26.32%  
---

# **Phase 5 — 50% Late Detection**

**Goal:** Identify employees requiring management attention.

Calculate:

Late % \> 50%

If true:

highLateFlag \= true

Create:

flaggedEmployees\[\]

This becomes the basis for the 3-month investigation.

### **Result**

Dashboard can say:

> **8 employees require attendance review**

---

# **Phase 6 — Three-Month Exception Workflow**

**Goal:** Only show historical data when necessary.

The uploaded files are:

May  
June  
July

July \= **Reporting Month**

Process:

July  
↓  
Calculate everyone  
↓  
Find Late % \> 50%  
↓  
Flag employees  
↓  
Find those employees in June  
↓  
Find those employees in May  
↓  
Generate 3-month comparison

### **Example**

John:

May       June       July  
92%       88%        90%  
18%       42%        56%

John gets a:

> **3-Month Attendance Review**

Someone with July Late % of 35% does **not** get the historical comparison.

This keeps the dashboard clean.

---

# **Phase 7 — Management Dashboard**

Now connect the calculation engine to the UI.

### **Top KPI cards**

Overall Attendance  
Present  
Absent  
Late  
Early Leave

### **Main charts**

**Attendance Trend**

Daily/weekly/monthly.

**Attendance Calendar**

Visual overview of attendance by date.

**Late Arrival Analysis**

Show:

* Total late  
* Average late duration  
* Late frequency

### **Management alerts**

Examples:

> 🔴 8 employees have late rate above 50%

> 🟠 12 employees have frequent early leave

> 🔴 4 employees have unusually high absence

---

# **Phase 8 — Employee Risk / Review Section**

Create a dedicated section:

### **Employees Requiring Review**

| Employee | Attendance | Late % | Late Days | Action |
| ----- | ----- | ----- | ----- | ----- |
| John Smith | 90% | 56% | 12 | View |
| Sarah Ahmed | 87% | 61% | 13 | View |

Click **View**.

Open:

### **Employee Attendance Review**

John Smith  
Employee ID: ESE019DHK

⚠ High Late Rate: 56%

Then:

**May | June | July**

with:

* Attendance %  
* Late %  
* Late days  
* Early leave  
* Total hours

And below that:

**Daily attendance history.**

---

# **Phase 9 — Filters & Search**

Add global filtering.

### **Filters**

* Date/month  
* Employee  
* Attendance status  
* Late  
* Early leave

### **Search**

Search by:

* Employee name  
* Employee ID

### **Important**

Filters should update:

* KPI cards  
* Charts  
* Employee list  
* Attendance table

---

# **Phase 10 — Detailed Attendance Table**

Build the complete data table.

Columns:

Employee  
Employee ID  
Date  
Clock In  
Clock Out  
Status  
Late  
Early Leave  
Total Hours

Features:

* Search  
* Sort  
* Filter  
* Pagination  
* Status badges  
* Date filtering  
* Employee filtering

Don't show Department unless you later decide management needs it.

---

# **Phase 11 — Export**

Add:

### **Export CSV**

Export currently filtered data.

### **Export Employee Report**

For a flagged employee:

May  
June  
July  
Summary  
Daily records

### **Optional later**

PDF management report.

I wouldn't build PDF until everything else is working.

---

# **Phase 12 — Settings**

Create a small configuration section.

Attendance Settings

On-time cutoff  
10:00 AM

Early leave cutoff  
7:00 PM

High late threshold  
50%

Working days  
Sunday  
Monday  
Tuesday  
Wednesday  
Thursday

Weekend  
Friday  
Saturday

This means you don't have to ask Claude to modify code if the company changes the rules.

---

# **Phase 13 — Error & Empty States**

This is important for a real management application.

Handle:

### **No CSV**

> Upload attendance files to generate your report.

### **Wrong CSV**

> Missing required column: Clock In

### **Wrong months**

> Please upload three consecutive months.

### **Duplicate records**

> 12 duplicate attendance records detected.

### **No data after filtering**

> No attendance records match your filters.

### **Only one month uploaded**

Allow it, but display:

> Historical comparison unavailable. Upload the previous two months to enable 3-month reviews.

---

# **Phase 14 — Final Polish**

Finally:

* Responsive design  
* Loading animations  
* Skeleton loaders  
* Smooth transitions  
* Empty states  
* Error handling  
* Accessibility  
* Performance optimization  
* Large CSV performance testing  
* Browser testing  
* Clean component architecture

---

# **Recommended Claude Workflow**

Use this workflow:

Phase 1  
 ↓  
Test  
 ↓  
Phase 2  
 ↓  
Test  
 ↓  
Phase 3  
 ↓  
Test  
 ↓  
Phase 4  
 ↓  
Test  
...

And after every phase:

> **Do not modify existing functionality unless required for this phase.**

That one instruction will save you a lot of headaches with vibe coding.

### **The overall architecture**

               CSV FILES  
                   │  
                   ▼  
            CSV VALIDATOR  
                   │  
                   ▼  
           DATA NORMALIZER  
                   │  
                   ▼  
         ATTENDANCE ENGINE  
                   │  
         ┌─────────┴─────────┐  
         ▼                   ▼  
  MONTHLY SUMMARY       DAILY RECORDS  
         │                   │  
         ▼                   ▼  
  50% LATE DETECTOR     DETAIL TABLE  
         │  
         ▼  
 3-MONTH EXCEPTION  
     May → June → July  
         │  
         ▼  
     DASHBOARD UI  
