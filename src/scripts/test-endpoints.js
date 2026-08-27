const http = require("http");

async function testUrl(path, cookie = "") {
  return new Promise((resolve) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        headers: {
          Cookie: cookie,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, data: data.slice(0, 300) });
        });
      }
    );
    req.on("error", (e) => resolve({ status: "ERROR", error: e.message }));
    req.end();
  });
}

async function run() {
  console.log("Testing endpoints...");

  // Test student login with vishal
  const postData = JSON.stringify({
    role: "STUDENT",
    identifier: "vishalk.23cse@kongu.edu",
    password: "Student@123",
  });

  const loginReq = http.request(
    "http://localhost:3000/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", async () => {
        console.log("Login status:", res.statusCode, data);
        const setCookie = res.headers["set-cookie"];
        const cookieStr = setCookie ? setCookie.map((c) => c.split(";")[0]).join("; ") : "";
        console.log("Cookie received:", cookieStr ? "YES" : "NO");

        if (cookieStr) {
          const authMe = await testUrl("/api/auth/me", cookieStr);
          console.log("/api/auth/me :", authMe.status, authMe.data);

          const dash = await testUrl("/api/student/dashboard", cookieStr);
          console.log("/api/student/dashboard :", dash.status, dash.data);

          const classes = await testUrl("/api/student/classes", cookieStr);
          console.log("/api/student/classes :", classes.status, classes.data);

          const materials = await testUrl("/api/student/materials", cookieStr);
          console.log("/api/student/materials :", materials.status, materials.data);

          const assignments = await testUrl("/api/student/assignments", cookieStr);
          console.log("/api/student/assignments :", assignments.status, assignments.data);

          const attendance = await testUrl("/api/student/attendance", cookieStr);
          console.log("/api/student/attendance :", attendance.status, attendance.data);

          const parentView = await testUrl("/api/student/parent-view", cookieStr);
          console.log("/api/student/parent-view :", parentView.status, parentView.data);

          const payments = await testUrl("/api/student/payments", cookieStr);
          console.log("/api/student/payments :", payments.status, payments.data);
        }
        process.exit(0);
      });
    }
  );
  loginReq.on("error", (e) => {
    console.error("Login req error:", e.message);
    process.exit(1);
  });
  loginReq.write(postData);
  loginReq.end();
}

run();
