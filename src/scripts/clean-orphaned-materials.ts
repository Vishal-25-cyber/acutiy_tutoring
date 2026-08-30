import connectToDatabase from "../lib/db/mongoose";
import Material from "../models/Material";
import User from "../models/User";

async function run() {
  await connectToDatabase();
  const users = await User.find().select("_id").lean();
  const validIds = users.map(u => u._id);

  const delResult = await Material.deleteMany({ uploadedBy: { $nin: validIds } });
  console.log("Deleted orphaned materials:", delResult);

  const remaining = await Material.find().populate("uploadedBy", "name email").lean();
  console.log("Remaining valid materials:", remaining.map(m => ({
    id: m._id,
    title: m.title,
    uploader: m.uploadedBy,
  })));

  process.exit(0);
}

run();
