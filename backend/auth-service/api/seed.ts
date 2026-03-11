import mongoose from "mongoose";
import config from "./config";
import User from "./models/user.model";

async function seed() {
  try {
    await mongoose.connect(config.mongoUri);

    console.log("MongoDB connected");

    await User.deleteMany({});

    await User.insertMany([
      {
        email: "rahul@gmail.com",
        password: "123456",
        firstName: "Rahul",
        lastName: "Sharma",
        role: "user",
        companyName: "Google",
      },
      {
        email: "priya@gmail.com",
        password: "123456",
        firstName: "Priya",
        lastName: "Singh",
        role: "user",
        companyName: "Microsoft",
      },
    ]);

    console.log("Dummy users added");

    await mongoose.disconnect();
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();