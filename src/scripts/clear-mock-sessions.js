const mongoose = require("mongoose");

async function clearMockSessions() {
  await mongoose.connect("mongodb://127.0.0.1:27017/acuity_tutoring");
  const result = await mongoose.connection.db.collection("livesessions").updateMany(
    {},
    { $set: { status: "COMPLETED" } }
  );
  console.log("Updated sessions to COMPLETED:", result.modifiedCount);
  process.exit(0);
}

clearMockSessions();
