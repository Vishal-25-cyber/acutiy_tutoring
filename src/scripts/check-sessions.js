const mongoose = require("mongoose");

async function checkSessions() {
  await mongoose.connect("mongodb://127.0.0.1:27017/acuity_tutoring");
  const sessions = await mongoose.connection.db.collection("livesessions").find().toArray();
  console.log("All LiveSessions in DB:", JSON.stringify(sessions, null, 2));
  process.exit(0);
}

checkSessions();
