import dotenv from "dotenv";
import mongoose from "mongoose";
import { seedGyms } from "./seedGyms";
import { seedUsers } from "./seedUsers";
import { seedBadges } from "./seedBadges";
import { seedExercisesAndRooms } from "./seedExerciseAndRooms";
import { seedChallenges } from "./seedChallenges";
import { seedParticipations } from "./seedParticipations";
import { seedThemes } from "./seedThemes";

dotenv.config();

(async () => {
	try {
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri) throw new Error("MONGO_URI is not defined in .env");

		console.log("Connecting to MongoDB...");
		await mongoose.connect(mongoUri);
		console.log("✅ Connected to MongoDB");

		console.log("\n--- Seeding users ---");
		await seedUsers();

		console.log("\n--- Seeding gyms ---");
		await seedGyms();

		console.log("\n--- Seeding exercises and rooms ---");
		await seedExercisesAndRooms();

		console.log("\n--- Seeding badges ---");
		await seedBadges();

		console.log("\n--- Seeding challenges ---");
		await seedChallenges();

		console.log("\n--- Seeding participations and sessions ---");
		await seedParticipations();

		console.log("\n--- Seeding themes ---");
		await seedThemes();

		console.log("\n✅ All seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error during seeding:", error);
	} finally {
		await mongoose.disconnect();
		console.log("🔌 Disconnected from MongoDB");
		process.exit(0);
	}
})();
