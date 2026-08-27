const mongoose = require("mongoose");

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/acuity_tutoring");
  const todayStr = new Date().toISOString().split("T")[0];
  console.log("Setting LiveSession dates to today:", todayStr);

  const batches = await mongoose.connection.db.collection("batches").find({}).toArray();
  const teachers = await mongoose.connection.db.collection("users").find({ role: "TEACHER" }).toArray();

  const teacherSarah = teachers.find((t) => t.name.includes("Sarah")) || teachers[0];
  const teacherRajesh = teachers.find((t) => t.name.includes("Rajesh")) || teachers[1] || teachers[0];
  const teacherAnita = teachers.find((t) => t.name.includes("Anita")) || teachers[2] || teachers[0];

  const batch6to7 = batches.find((b) => b.name.includes("6:00")) || batches[0];
  const batch7to8 = batches.find((b) => b.name.includes("7:00")) || batches[1] || batches[0];

  // Update existing sessions to today and ensure both batches have live sessions
  await mongoose.connection.db.collection("livesessions").deleteMany({});

  await mongoose.connection.db.collection("livesessions").insertMany([
    {
      title: "Class 10 — Quadratic Equations & Problem Solving Masterclass",
      subject: "Mathematics",
      classLevel: "Class 10",
      batchId: batch6to7._id,
      teacherId: teacherSarah._id,
      topic: "Roots of Quadratic Equations & Standard Discriminant Word Problems",
      date: todayStr,
      startTime: "18:00",
      endTime: "19:00",
      status: "LIVE",
      livekitRoomId: "acuity-class10-maths-live",
      gracePeriodMinutes: 5,
      allowLateJoinManually: false,
      activePoll: {
        question: "What is the discriminant value of 2x² - 4x + 3 = 0?",
        options: [
          { text: "D > 0 (Two real roots)", votes: 3 },
          { text: "D = 0 (Equal roots)", votes: 1 },
          { text: "D < 0 (No real roots)", votes: 9 },
          { text: "Cannot be determined", votes: 0 },
        ],
        isActive: true,
        votedUserIds: [],
      },
    },
    {
      title: "Class 10 — Light: Reflection & Refraction Masterclass",
      subject: "Science",
      classLevel: "Class 10",
      batchId: batch7to8._id,
      teacherId: teacherRajesh._id,
      topic: "Ray Diagrams, Lens Formulas & Solved Exemplar Numericals",
      date: todayStr,
      startTime: "19:00",
      endTime: "20:00",
      status: "SCHEDULED",
      livekitRoomId: "acuity-class10-science-live",
      gracePeriodMinutes: 5,
    },
    {
      title: "Class 9 — Laws of Motion & Momentum Lab",
      subject: "Science",
      classLevel: "Class 9",
      batchId: batch6to7._id,
      teacherId: teacherRajesh._id,
      topic: "Newton's 2nd Law (F = ma) & Numerical Problems",
      date: todayStr,
      startTime: "18:00",
      endTime: "19:00",
      status: "LIVE",
      livekitRoomId: "acuity-class9-science-live",
      gracePeriodMinutes: 5,
    },
  ]);

  console.log("✅ Updated LiveSessions in MongoDB for today!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
