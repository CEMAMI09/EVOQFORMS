const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Update this path to match your database location
const dbPath = path.join(__dirname, "public", "dashboard", "data.db");

console.log("🔄 Starting database migration...");
console.log("📂 Database path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database");
});

// Drop old table and create new one
db.serialize(() => {
  console.log("🗑️  Dropping old intake_form table...");
  
  db.run("DROP TABLE IF EXISTS intake_form", (err) => {
    if (err) {
      console.error("❌ Error dropping table:", err.message);
      process.exit(1);
    }
    console.log("✅ Old table dropped");
    
    console.log("🔨 Creating new intake_form table with updated schema...");
    
    db.run(`
      CREATE TABLE intake_form (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accountName TEXT,
        primaryEmail TEXT,
        backupEmail TEXT,
        locationAddress TEXT,
        keyContact TEXT,
        billingAddress TEXT,
        cardName TEXT,
        cardNumber TEXT,
        cardExpiry TEXT,
        cardCVV TEXT,
        billingZipCode TEXT,
        patientPopulation TEXT,
        otherPatientInfo TEXT,
        wifiSSID TEXT,
        wifiPassword TEXT,
        wifiSecurity TEXT,
        wifiFrequency TEXT,
        ehrSystems TEXT,
        practiceLogoPath TEXT
      )
    `, (err) => {
      if (err) {
        console.error("❌ Error creating table:", err.message);
        process.exit(1);
      }
      console.log("✅ New table created successfully!");
      
      // Verify the table was created
      db.all("PRAGMA table_info(intake_form)", [], (err, rows) => {
        if (err) {
          console.error("❌ Error verifying table:", err.message);
        } else {
          console.log("\n📋 New table structure:");
          rows.forEach(row => {
            console.log(`   - ${row.name} (${row.type})`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error("❌ Error closing database:", err.message);
          } else {
            console.log("\n✅ Migration complete! You can now restart your server.");
          }
        });
      });
    });
  });
});