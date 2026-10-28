import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import connectDB from "../config/db.js";

dotenv.config();

const SALT_ROUNDS = 12;

async function seedSuperAdmin() {
  try {
    await connectDB();

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) {
      console.log("SuperAdmin already exists:");
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log("Skipping creation...");
      process.exit(0);
    }

    // Create superadmin
    const superAdminData = {
      name: process.env.SUPERADMIN_NAME || "Super Admin",
      email: process.env.SUPERADMIN_EMAIL || "superadmin@example.com",
      phone: process.env.SUPERADMIN_PHONE || "9999999999",
      password: process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123"
    };

    const passwordHash = await bcrypt.hash(superAdminData.password, SALT_ROUNDS);

    const superAdmin = await User.create({
      name: superAdminData.name,
      email: superAdminData.email,
      phone: superAdminData.phone,
      passwordHash,
      role: "superadmin",
      society: null,
      isActive: true
    });

    console.log("\n✓ SuperAdmin created successfully!");
    console.log("=================================");
    console.log(`Name: ${superAdmin.name}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: ${superAdminData.password}`);
    console.log("=================================");
    console.log("\nIMPORTANT: Please change the password after first login!");
    console.log("You can customize the superadmin credentials by setting these environment variables:");
    console.log("- SUPERADMIN_NAME");
    console.log("- SUPERADMIN_EMAIL");
    console.log("- SUPERADMIN_PASSWORD\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding superadmin:", error);
    process.exit(1);
  }
}

seedSuperAdmin();
