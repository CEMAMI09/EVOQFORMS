const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data.db");

db.all("SELECT * FROM intake_form", (err, rows) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Current entries in intake_form:");
    console.table(rows);
  }
  db.close();
});
