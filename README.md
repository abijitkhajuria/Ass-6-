# VIT Semester Result Portal

A full-stack semester result portal for VIT Computer Engineering: record MSE/ESE marks,
compute grades and SGPA server-side, browse cohort analytics, and print a formal
marksheet on A4.

- **Backend** — Spring Boot 3.3.5, Java 21, Maven, Spring Web + Data JPA + Validation, MySQL
- **Frontend** — React 18 + Vite, plain JavaScript (no TypeScript), React Router,
  Tailwind CSS, lucide-react, Recharts, Framer Motion
- **Database** — MySQL 9.x, with `schema.sql` and a 15-student `seed.sql`

---

## 1. Prerequisites

| Tool  | Version used | Check with        |
| ----- | ------------ | ----------------- |
| JDK   | 21 or newer  | `java -version`   |
| Maven | 3.9+         | `mvn -v`          |
| Node  | 20 or newer  | `node -v`         |
| MySQL | 9.x          | MySQL CLI Client  |

> The build targets Java 21 (`maven.compiler.release=21`). A newer JDK on `JAVA_HOME`
> is fine — it compiles to 21 bytecode.

---

## 2. MySQL setup (PowerShell)

Open **PowerShell** in the project root.

Add the MySQL client to your session `PATH` (adjust the version folder if yours differs):

```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 9.3\bin"
```

Create the schema and load the seed data. Both files are idempotent, so re-running them
is safe:

```powershell
mysql -u root -p < backend\src\main\resources\db\schema.sql
```

```powershell
mysql -u root -p < backend\src\main\resources\db\seed.sql
```

You can also paste the contents of both files into the **MySQL Command Line Client**.

### Credentials

`backend/src/main/resources/application.properties` ships with **placeholders only** —
no real password is committed:

```properties
spring.datasource.username=${DB_USERNAME:YOUR_MYSQL_USERNAME}
spring.datasource.password=${DB_PASSWORD:YOUR_MYSQL_PASSWORD}
```

Supply your own credentials one of two ways.

**Environment variables** (preferred — nothing on disk):

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-password"
```

**Or a local override file** `backend/src/main/resources/application-local.properties`
(already in `.gitignore`), then run with `--spring.profiles.active=local`.

---

## 3. Run the backend

```powershell
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.

`spring.jpa.hibernate.ddl-auto=update` creates or patches the tables on boot, and a
seeder loads the same 15-student cohort as `seed.sql` **if the tables are empty** — so
the dashboard has data on first run even if you skipped step 2. Disable it with
`app.seed.enabled=false`.

### Running without MySQL (optional)

To try the app before configuring MySQL, a `demo` profile runs everything against an
in-memory H2 database:

```powershell
mvn spring-boot:run "-Pdemo" "-Dspring-boot.run.profiles=demo"
```

Data lives only for the life of the process. MySQL remains the default.

---

## 4. Run the frontend

In a second PowerShell window:

```powershell
cd frontend
npm install
```

```powershell
npm run dev
```

The UI is on **http://localhost:5173**. Vite proxies `/api` to `localhost:8080`, so
both servers must be running.

Production build:

```powershell
npm run build
```

---

## 5. Grading rules

Implemented once, in `backend/src/main/java/com/vit/results/util/GradeScale.java`.

**Components** — MSE out of **30** (the 30% component), ESE out of **70** (the 70%
component). `Total = MSE + ESE`, out of 100.

**Grade bands**, applied to the total:

| Total  | Grade | Point |
| ------ | ----- | ----- |
| 90–100 | O     | 10    |
| 80–89  | A+    | 9     |
| 70–79  | A     | 8     |
| 60–69  | B+    | 7     |
| 50–59  | B     | 6     |
| 45–49  | C     | 5     |
| 40–44  | P     | 4     |
| < 40   | F     | 0     |

**Failing a subject** — a subject is failed when **either**:

1. `total < 40`, **or**
2. `ESE < 28` (the end-semester minimum)

The ESE floor overrides the band: a student scoring 26 MSE + 25 ESE has a total of 51,
which would be a B, but the subject is graded **F** because the ESE is under 28. The
marksheet and the marks-entry screen both state which condition caused the failure, e.g.
*"ESE 25/70 is below the minimum of 28"*, and both conditions are reported when both
apply.

**SGPA** — `Σ(grade point × credits) / Σ(credits)`, rounded to 2 decimals.
Any subject graded F makes the semester result **FAIL**, regardless of SGPA.

**Subjects** (14 credits total):

| Code   | Subject                           | Short | Credits |
| ------ | --------------------------------- | ----- | ------- |
| CE3101 | Database Management Systems       | DBMS  | 4       |
| CE3102 | Operating Systems                 | OS    | 4       |
| CE3103 | Theory of Computation             | TOC   | 3       |
| CE3104 | Design and Analysis of Algorithms | DAA   | 3       |

---

## 6. API reference

Base URL `http://localhost:8080`. All bodies are JSON.

### Students

| Method   | Endpoint                   | Description                                              |
| -------- | -------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/students`            | All students                                             |
| `GET`    | `/api/students/summaries`  | Student rows **with computed SGPA and status** (list page)|
| `GET`    | `/api/students/divisions`  | Distinct divisions, for the filter dropdown              |
| `GET`    | `/api/students/{id}`       | One student by id                                        |
| `GET`    | `/api/students/prn/{prn}`  | One student by PRN                                       |
| `POST`   | `/api/students`            | Create → `201`                                           |
| `PUT`    | `/api/students/{id}`       | Update                                                   |
| `DELETE` | `/api/students/{id}`       | Delete → `204` (marks cascade)                           |

### Subjects

| Method   | Endpoint             | Description                                        |
| -------- | -------------------- | -------------------------------------------------- |
| `GET`    | `/api/subjects`      | All subjects, in display order                     |
| `GET`    | `/api/subjects/{id}` | One subject                                        |
| `POST`   | `/api/subjects`      | Create → `201`                                     |
| `PUT`    | `/api/subjects/{id}` | Update                                             |
| `DELETE` | `/api/subjects/{id}` | Delete → `204`; `400` if any marks reference it    |

### Marks

| Method   | Endpoint                        | Description                                                     |
| -------- | ------------------------------- | --------------------------------------------------------------- |
| `GET`    | `/api/marks`                    | All marks entries                                               |
| `GET`    | `/api/marks?studentId={id}`     | Marks for one student                                           |
| `GET`    | `/api/marks/{id}`               | One marks entry                                                 |
| `POST`   | `/api/marks`                    | Create → `201`; `400` on a duplicate (student, subject)         |
| `PUT`    | `/api/marks/{id}`               | Update MSE/ESE of one entry                                     |
| `DELETE` | `/api/marks/{id}`               | Delete → `204`                                                  |
| `PUT`    | `/api/marks/student/{studentId}`| **Upsert the whole entry sheet** and return the computed marksheet |

### Results, analytics and grading

| Method | Endpoint                  | Description                                                      |
| ------ | ------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/api/results`            | Computed marksheets for every student                            |
| `GET`  | `/api/results/{prn}`      | **The computed marksheet DTO** for one PRN                       |
| `GET`  | `/api/analytics/summary`  | Dashboard payload: totals, average SGPA, pass %, topper, subject averages, grade distribution, division stats |
| `GET`  | `/api/grading/scale`      | The grading bands and thresholds, as data (see assumption 1)      |

### Request body shapes

```jsonc
// POST/PUT /api/students
{ "prn": "12310001", "name": "Aarav Deshmukh", "division": "A",
  "branch": "Computer Engineering", "semester": 5 }

// POST /api/marks
{ "studentId": 1, "subjectId": 1, "mseMarks": 27, "eseMarks": 62 }

// PUT /api/marks/{id}
{ "mseMarks": 27, "eseMarks": 62 }

// PUT /api/marks/student/{studentId}
{ "entries": [ { "subjectId": 1, "mseMarks": 27, "eseMarks": 62 }, ... ] }
```

### Error shape

Every failure returns the same envelope, which the UI surfaces as a toast:

```json
{
  "timestamp": "2026-09-09T09:18:24.977Z",
  "status": 400,
  "error": "Validation failed",
  "message": "MSE marks cannot exceed 30",
  "path": "/api/marks",
  "fieldErrors": [{ "field": "mseMarks", "message": "MSE marks cannot exceed 30" }]
}
```

`400` — validation failure, out-of-range marks, duplicate PRN / subject code /
(student, subject) pair. `404` — unknown id or PRN. `500` — unexpected.

---

## 7. Validation

Enforced on **both** sides, and on three layers server-side.

**Client** (`frontend/src/lib/preview.js`) — inputs accept digits only; MSE ≤ 30,
ESE ≤ 70, no negatives, whole numbers. Errors appear inline under the field on blur,
the field gets `aria-invalid`, and Save stays disabled while anything is invalid.

**Server** — Bean Validation on the request DTOs, an explicit range check in
`MarkService.validateRange`, and `CHECK` / `UNIQUE` constraints in the schema.
Duplicate `(student, subject)` entries are rejected with a readable message naming the
subject and student.

---

## 8. Features

1. **Dashboard** — stat cards (total students, class average SGPA, pass %, topper) plus
   a subject-wise average bar chart, a grade-distribution chart and a division table.
2. **Marks entry** — one student at a time, all four subjects in an editable table;
   total, grade and SGPA update live as you type, before saving.
3. **Student list** — search by name/PRN, filter by division and result, sort by SGPA,
   name or PRN, with colour-coded pass/fail pills that always carry a text label.
4. **Marksheet** — formal result card: subject-wise MSE, ESE, total, grade, point and
   credits, then SGPA and status, revealed with a staggered animation.
5. **Print / PDF** — `@media print` A4 stylesheet: no nav, no buttons, no dark
   surfaces, hairline table rules, and a signature footer.

Dark mode is the default with a light-mode toggle persisted in `localStorage`.
Empty, loading (skeletons) and error states are designed for every page; tables
collapse into stacked label/value cards below 640px.

---

## 9. Project layout

```
.
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/vit/results/
│       │   ├── config/       CorsConfig, DataSeeder
│       │   ├── controller/   Student, Subject, Mark, Result, Analytics, Grading
│       │   ├── dto/          request + response records
│       │   ├── entity/       Student, Subject, Mark
│       │   ├── exception/    ApiError + GlobalExceptionHandler
│       │   ├── repository/   Spring Data JPA repositories
│       │   ├── service/      Student, Subject, Mark, Result, Analytics
│       │   └── util/         GradeScale  ← the only definition of the rules
│       └── resources/
│           ├── application.properties
│           ├── application-demo.properties
│           └── db/           schema.sql, seed.sql
└── frontend/
    └── src/
        ├── components/  AppShell, Primitives, CountUp
        ├── lib/         api, preview, format, ThemeContext, ToastContext
        └── pages/       Dashboard, StudentList, MarksEntry, Marksheet, NotFound
```

---

## 10. Assumptions and decisions

1. **Live preview vs. server-only computation.** The brief asks for grade/SGPA to
   recompute live as you type *and* for business logic to live only on the server.
   Rather than duplicating the rules in JavaScript, the backend publishes them as data
   at `GET /api/grading/scale`, and `frontend/src/lib/preview.js` is a table
   interpreter with no thresholds of its own. Saving always round-trips through the
   API, and the marksheet only ever renders the server-computed result.

2. **Seeding runs from `@PostConstruct`, not an `ApplicationRunner`.** Runners fire
   after Tomcat starts accepting connections, which left a window where an early
   request could collide with the seed inserts and fail on the unique constraint.

3. **CORS uses origin *patterns* for localhost.** Vite silently falls back to 5174,
   5175… when 5173 is taken, and a mismatch surfaces as an opaque `403` on the first
   write. Narrow `app.cors.allowed-origin-patterns` to exact origins before deploying.

4. **Totals and grades are never stored.** Only `mse_marks` and `ese_marks` are
   persisted; everything derived is computed on read, so a rule change cannot leave
   stale grades in the database.

5. **The topper must have passed.** A student with a failed subject is excluded from
   the topper calculation regardless of raw SGPA.

6. **`INCOMPLETE` is a third status.** A student with fewer than four subjects recorded
   is neither pass nor fail; the list and marksheet show *Incomplete*.

7. **Semester scope.** One semester (5) and four subjects, per the brief. The schema
   has no semester column on `marks`, so the portal covers a single semester's results.

8. **`ddl-auto=update`** is set as requested. It never drops columns, so `schema.sql`
   remains the authoritative definition.

9. **Deleting a student cascades** to their marks. Deleting a *subject* is blocked
   while any marks reference it.

10. **Seed cohort.** 15 students across divisions A/B/C with a deliberate spread: one
    perfect scorer (SGPA 10.00), a long middle band, and three failures exercising both
    fail conditions — Kabir Shaikh fails DBMS on the ESE floor alone, Arjun Chavan and
    Om Jadhav fail on both conditions. Class average SGPA 7.14, pass rate 80%.

---

## 11. Tests

```powershell
cd backend
mvn test
```

`GradeScaleTest` covers every grade boundary, both fail conditions, and the case where
they apply together.
