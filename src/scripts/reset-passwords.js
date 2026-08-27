const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/acuity_tutoring");
  const hash = await bcrypt.hash("Student@123", 10);
  await mongoose.connection.db.collection("users").updateMany(
    { role: "STUDENT" },
    { $set: { passwordHash: hash, status: "ACTIVE" } }
  );
  console.log("✅ All student passwords set to Student@123");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
