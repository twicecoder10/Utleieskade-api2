const { syncDatabase } = require("../models");

const args = process.argv.slice(2);
const forceSync = args.includes("--force");

const sync = async () => {
  try {
    console.log(`🔄 Synchronizing database... (Force: ${forceSync})`);
    await syncDatabase(forceSync);
    console.log("✅ Database synchronized successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing database:", error);
    process.exit(1);
  }
};

sync();
