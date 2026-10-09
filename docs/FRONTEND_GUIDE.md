# Frontend Implementation & API Integration Guide

> **Audience**: Frontend Developers & UI Engineers  
> **Backend Service**: Course Catalog Service  
> **Base URL**: `http://localhost:8002`  
> **Interactive Swagger UI**: [http://localhost:8002/docs](http://localhost:8002/docs)  

---

## 1. Overview & UI Specification

According to the official requirements ([Project Progress Section 2.7](file:///c:/Users/USER/Documents/KMITL/Year%203/Software%20Design%20and%20Architecture/lect09/workspace/md/Project_Progress_Student_Course_Registration.md#L295-L325)), the frontend student portal consists of **4 core views**:

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [ KMITL LOGO ]   STUDENT COURSE REGISTRATION PORTAL                              Academic Year: 2026/1 | User: 65010042 |
+-------------------------------------------------------------------------------------------------------------------------+
| [1. Search Catalog]  |  [2. Weekly Timetable]  |  [3. My Cart / Validation]  |  [4. Registered Courses & Waitlist]      |
+-------------------------------------------------------------------------------------------------------------------------+
```

> [!NOTE]
> **No complex graph drawing or visual DAG canvases are required.**
> The prerequisite engine runs on the backend. The frontend only displays whether prerequisites are `MET` or `MISSING`.

---

## 2. Page & Component Breakdown

### Screen 1: Course Catalog & Section Search
* **Purpose**: Browse available subjects and check live seat availability.
* **UI Controls**:
  - **Search Input**: Keyword search matching course code or title (e.g. `"CS101"` or `"Software"`).
  - **Department Dropdown**: Filter by department (e.g. `"Computer Engineering"`).
  - **Day Dropdown**: Filter by day (`"MON"`, `"TUE"`, `"WED"`, `"THU"`, `"FRI"`).
  - **Toggle**: *"Show Only Open Sections"* (`open_only=true`).
* **Section Table / Card Attributes**:
  - `course_code` (e.g. `CS301`) & `title`
  - `section_number` (e.g. `Sec 1`)
  - `instructor` (e.g. `Dr. Veera B.`)
  - `schedule_days` & time (e.g. `Mon, Wed 09:00 - 10:30`)
  - `room` (e.g. `HM402`)
  - **Seat Badge**:
    - If `enrolled_count < capacity`: Green badge `48/50 OPEN` $\rightarrow$ Button: `[ Enroll / Add to Cart ]`
    - If `enrolled_count >= capacity`: Red badge `50/50 FULL` $\rightarrow$ Button: `[ Join Waitlist ]`

---

### Screen 2: Weekly Timetable Preview
* **Purpose**: Visual 5-day schedule grid showing enrolled and staged classes.
* **UI Elements**:
  - Standard weekly calendar grid: Columns = **Monday to Friday**, Rows = **08:00 to 18:00**.
  - Section blocks placed using:
    - Day: `schedule_days` (e.g. `["MON", "WED"]`)
    - Start & End: `start_time` (`"09:00"`) to `end_time` (`"10:30"`).
  - Color coding: Blue for enrolled classes, amber for staged/cart classes.

---

### Screen 3: Cart / Staging & Pre-Flight Validation Bar
* **Purpose**: Summary of selected courses before submitting enrollment.
* **UI Elements**:
  - List of selected courses with credit counts.
  - **Validation Summary Bar**:
    - **Total Credits**: Planned vs. maximum cap (e.g. `18 / 22 Credits`).
    - **Prerequisites Status**:
      - If valid: Green badge `Prereqs: MET`
      - If missing: Red badge `Prereqs: MISSING CS102`
    - **Schedule Conflict Status**: `Clashes: NONE` vs `Conflict: Sec 1 overlaps with Sec 3`.
  - **Action**: `[ Confirm & Enroll ]` button (disabled if validation fails).

---

### Screen 4: Registered Courses & Waitlist Tab
* **Purpose**: View confirmed registrations and active waitlist positions.
* **UI Elements**:
  - **Enrolled Table**: Course code, title, section, credits, and a `[ Drop Course ]` button.
  - **Waitlist Table**: Course code, section, and current queue position (e.g. `Position: #1 in queue`).

---

## 3. Backend API Cheat Sheet (Catalog Service: Port 8002)

### A. List Courses
* **Endpoint**: `GET http://localhost:8002/courses`
* **Query Params**:
  - `search` (string, optional) — e.g. `?search=Data`
  - `department` (string, optional) — e.g. `?department=Computer Engineering`
* **Sample Response**:
  ```json
  [
    {
      "code": "CS301",
      "title": "Software Design & Architecture",
      "credits": 3,
      "prerequisites": ["CS102", "CS202"]
    }
  ]
  ```

---

### B. List Sections (With Real-Time Seat Telemetry)
* **Endpoint**: `GET http://localhost:8002/sections`
* **Query Params**:
  - `course_code` (string, optional) — e.g. `?course_code=CS301`
  - `day` (string, optional) — e.g. `?day=MON`
  - `open_only` (boolean, optional) — e.g. `?open_only=true`
* **Sample Response**:
  ```json
  [
    {
      "id": 101,
      "course_code": "CS301",
      "section_number": 1,
      "capacity": 10,
      "enrolled_count": 0,
      "schedule_days": ["MON", "WED"],
      "start_time": "09:00",
      "end_time": "10:30",
      "room": "HM402",
      "instructor": "Dr. Veera B."
    }
  ]
  ```

---

### C. Validate Student Prerequisites (Pre-Flight Check)
* **Endpoint**: `POST http://localhost:8002/validate-prereqs`
* **Request Payload**:
  ```json
  {
    "student_id": "STU_001",
    "course_code": "CS301",
    "completed_courses": ["CS101", "CS102"]
  }
  ```
* **Success Response (`is_valid: true`)**:
  ```json
  {
    "is_valid": true,
    "missing_prereqs": [],
    "message": "All prerequisites satisfied."
  }
  ```
* **Failure Response (`is_valid: false`)**:
  ```json
  {
    "is_valid": false,
    "missing_prereqs": ["CS202"],
    "message": "Missing required prerequisite(s): CS202"
  }
  ```

---

## 4. Upcoming Enrollment Endpoints Preview (Port 8003)

When the Enrollment Service is connected:
* **Enroll / Reserve Seat**: `POST /api/v1/enrollments` with body `{"section_id": 101}`.
* **Drop Section**: `POST /api/v1/drops` with body `{"section_id": 101}`.
* **Claim Waitlist Slot**: `POST /api/v1/waitlist/claim` with body `{"offer_id": 5}`.

---

## 5. How to Test Right Now
1. The backend catalog service is already running on **`http://localhost:8002`**.
2. Open **[http://localhost:8002/docs](http://localhost:8002/docs)** in your browser to inspect and test all API payloads directly with live data.
