const http = require("http");

function request(path, options = {}) {
  return new Promise((resolve) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );
    req.on("error", (e) => resolve({ statusCode: 500, error: e.message }));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function login(role, identifier, password, batchId = "6a8963fe55bca816eb4b30d8") {
  const body = JSON.stringify({ role, identifier, email: identifier, password, batchId });
  const res = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  const cookies = res.headers["set-cookie"];
  const cookieHeader = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";
  return { status: res.statusCode, cookie: cookieHeader, data: res.data };
}

async function run() {
  console.log("=== COMPREHENSIVE ROUTE CHECK ===");

  // 1. Student Login & Student Pages (Vishal)
  console.log("\n--- Testing Student Session (Vishal) ---");
  const studentAuth = await login("STUDENT", "vishalk.23cse@kongu.edu", "Student@123", "6a8963fe55bca816eb4b30d8");
  console.log("Student Login:", studentAuth.status, studentAuth.cookie ? "Cookie OK" : "NO COOKIE", studentAuth.data);

  if (studentAuth.cookie) {
    const studentRoutes = [
      "/student/dashboard",
      "/student/classes",
      "/student/materials",
      "/student/assignments",
      "/student/attendance",
      "/student/performance",
      "/student/ai-tutor",
      "/student/fees",
      "/student/parent-view",
      "/api/auth/me",
      "/api/student/dashboard",
      "/api/student/classes",
      "/api/student/materials",
      "/api/student/assignments",
      "/api/student/attendance",
      "/api/student/performance",
      "/api/student/parent-view",
      "/api/student/payments",
    ];

    for (const r of studentRoutes) {
      const res = await request(r, { headers: { Cookie: studentAuth.cookie } });
      const isOk = res.statusCode === 200;
      console.log(`Student Route [${r}]: ${res.statusCode} ${isOk ? "✓" : "❌ ERROR: " + res.data.slice(0, 150)}`);
    }
  }

  console.log("\n=== TEST COMPLETED ===");
  process.exit(0);
}

run();
