require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash("Admin@1234", 12);
  const result = await User.updateOne(
    { email: "admin@internmatch.com" },
    { $set: { password: hash } }
  );
  console.log("✅ Password reset! Updated:", result.modifiedCount, "document");
  console.log("   Email:    admin@internmatch.com");
  console.log("   Password: Admin@1234");
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});