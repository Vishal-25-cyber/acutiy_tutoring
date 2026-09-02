import connectToDatabase from "../lib/db/mongoose";
import SystemSettings from "../models/SystemSettings";

async function main() {
  await connectToDatabase();
  await SystemSettings.updateMany({}, { $set: { upiId: "karunyas001-1@okicici" } });
  const doc = await SystemSettings.findOne().lean();
  console.log("✅ Updated Atlas UPI ID:", doc?.upiId);
  process.exit(0);
}

main();
