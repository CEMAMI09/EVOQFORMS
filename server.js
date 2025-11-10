console.log("✅ server.js has started running...");
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const app = express();
const PORT = 3000;

// ================= MIDDLEWARE =================
const publicPath = path.join(__dirname, "public");
console.log("📂 Serving static files from:", publicPath);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(publicPath));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MULTER SETUP =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ================= DATABASE =================
const dbPath = path.join(publicPath, "dashboard", "data.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error:", err.message);
  else console.log("Connected to SQLite database at", dbPath);
});

// Create intake form table
db.run(`
CREATE TABLE IF NOT EXISTS intake_form (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accountName TEXT,
  primaryEmail TEXT,
  backupEmail TEXT,
  locationAddress TEXT,
  keyContact TEXT,
  billingInfo TEXT,
  patientPopulation TEXT,
  otherPatientInfo TEXT,
  wifiSettings TEXT,
  ehrSystems TEXT,
  practiceLogoPath TEXT
)
`);

// Create quiz table
db.run(`
CREATE TABLE IF NOT EXISTS certification_quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientName TEXT NOT NULL,
  question1 TEXT,
  question2 TEXT,
  question3 TEXT,
  question4 TEXT,
  question5 TEXT,
  question6 TEXT,
  question7 TEXT,
  question8 TEXT,
  question9 TEXT,
  question10 TEXT,
  score INTEGER,
  submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
  if (err) {
    console.error("Error creating certification_quiz table:", err);
  } else {
    console.log("✅ certification_quiz table ready");
  }
});

// ================= ROUTES =================

// Home → Customer Intake Form
app.get("/", (req, res) => {
  console.log("➡️ GET / hit - sending CustomerIntakeForm.html");
  res.sendFile(path.join(publicPath, "CustomerIntakeForm.html"));
});

// Dashboard page (this is the main dashboard with sidebar)
app.get("/dashboard", (req, res) => {
  console.log("➡️ GET /dashboard hit - sending index.html");
  res.sendFile(path.join(publicPath, "index.html"));
});

// Quiz page (the certification quiz form)
app.get("/quiz", (req, res) => {
  console.log("➡️ GET /quiz hit - sending quiz.html");
  res.sendFile(path.join(publicPath, "quiz.html"));
});

// Completed Form
app.get("/completed", (req, res) => {
  res.sendFile(path.join(publicPath, "CompletedForm.html"));
});

// Handle intake form submission
app.post("/submit", upload.single("practiceLogo"), (req, res) => {
  const {
    accountName, primaryEmail, backupEmail, locationAddress, keyContact,
    billingInfo, patientPopulation, otherPatientInfo, wifiSettings, ehrSystems
  } = req.body;
  const logoPath = req.file ? req.file.path : null;
  
  db.run(
    `INSERT INTO intake_form (
      accountName, primaryEmail, backupEmail, locationAddress, keyContact,
      billingInfo, patientPopulation, otherPatientInfo, wifiSettings, ehrSystems,
      practiceLogoPath
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      accountName, primaryEmail, backupEmail, locationAddress, keyContact,
      billingInfo, patientPopulation, otherPatientInfo, wifiSettings, ehrSystems,
      logoPath
    ],
    (err) => {
      if (err) {
        console.error("SQLITE ERROR:", err.message);
        return res.status(500).send("Error saving data.");
      }
      res.redirect("/CompletedForm.html");
    }
  );
});

// Handle quiz submission
app.post("/submit-quiz", (req, res) => {
  console.log("➡️ POST /submit-quiz hit");
  console.log("Request body:", req.body);
  
  const {
    clientName,
    answers,
    score
  } = req.body;

  // Validate that we have a client name
  if (!clientName || clientName.trim() === '') {
    console.error("Validation error: Client name is required");
    return res.status(400).json({ error: "Client name is required" });
  }

  // Insert quiz data into database
  db.run(
    `INSERT INTO certification_quiz (
      clientName, question1, question2, question3, question4, question5,
      question6, question7, question8, question9, question10, score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientName,
      answers[0] || '',
      answers[1] || '',
      answers[2] || '',
      answers[3] || '',
      answers[4] || '',
      answers[5] || '',
      answers[6] || '',
      answers[7] || '',
      answers[8] || '',
      answers[9] || '',
      score
    ],
    function(err) {
      if (err) {
        console.error("SQLITE ERROR:", err.message);
        return res.status(500).json({ error: "Failed to save quiz data" });
      }
      console.log("✅ Quiz submitted successfully, ID:", this.lastID);
      res.json({ 
        success: true, 
        message: "Quiz submitted successfully",
        id: this.lastID 
      });
    }
  );
});

// API: Get all intake forms
app.get("/api/intake-forms", (req, res) => {
  console.log("➡️ GET /api/intake-forms hit");
  db.all("SELECT * FROM intake_form ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.error("SQLITE ERROR:", err.message);
      return res.status(500).json({ error: "Failed to retrieve data." });
    }
    console.log(`✅ Retrieved ${rows.length} intake forms`);
    res.json(rows);
  });
});

// API: Get all quiz submissions
app.get("/api/quiz-submissions", (req, res) => {
  console.log("➡️ GET /api/quiz-submissions hit");
  db.all(
    "SELECT * FROM certification_quiz ORDER BY submittedAt DESC", 
    [], 
    (err, rows) => {
      if (err) {
        console.error("SQLITE ERROR:", err.message);
        return res.status(500).json({ error: "Failed to retrieve quiz data" });
      }
      console.log(`✅ Retrieved ${rows.length} quiz submissions`);
      res.json(rows);
    }
  );
});

// API: Get specific quiz submission by ID
app.get("/api/quiz-submissions/:id", (req, res) => {
  console.log(`➡️ GET /api/quiz-submissions/${req.params.id} hit`);
  db.get(
    "SELECT * FROM certification_quiz WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        console.error("SQLITE ERROR:", err.message);
        return res.status(500).json({ error: "Failed to retrieve quiz data" });
      }
      if (!row) {
        return res.status(404).json({ error: "Quiz submission not found" });
      }
      console.log(`✅ Retrieved quiz submission ID: ${req.params.id}`);
      res.json(row);
    }
  );
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard at http://localhost:${PORT}/dashboard`);
  console.log(`📝 Quiz at http://localhost:${PORT}/quiz`);
});