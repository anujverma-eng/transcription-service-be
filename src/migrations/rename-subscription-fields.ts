import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/your_db_name";

async function migrateDailyLimitFields() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    const subscriptionCollection = db.collection("subscriptions");

    // First, create a backup collection
    await db.createCollection("subscriptions_backup");
    await subscriptionCollection
      .aggregate([{ $out: "subscriptions_backup" }])
      .toArray();
    console.log("Backup created successfully");

    // Perform the field rename operations
    const result = await subscriptionCollection.updateMany(
      {},
      {
        $rename: {
          dailyLimit: "totalLimit",
          dailyUsedMinutes: "totalUsedMinutes",
        },
      },
    );

    console.log("Migration completed successfully");
    console.log(`Modified ${result.modifiedCount} documents`);
  } catch (error) {
    console.error("Migration failed:", error);

    // Attempt to restore from backup if something went wrong
    try {
      await client.db().admin().ping();
      const db = client.db();
      await db.collection("subscriptions").drop();
      await db
        .collection("subscriptions_backup")
        .aggregate([{ $out: "subscriptions" }])
        .toArray();
      console.log("Restored from backup");
    } catch (restoreError) {
      console.error("Failed to restore from backup:", restoreError);
    }
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
migrateDailyLimitFields().catch(console.error);
