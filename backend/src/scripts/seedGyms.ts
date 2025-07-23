import { Gym } from "../models/Gym";
import { User } from "../models/User";

export const seedGyms = async () => {
	console.log("Seeding gyms...");

	await Gym.deleteMany({});

	const gymOwner = await User.findOne({ email: "gymowner@example.com" });
	if (!gymOwner) {
		throw new Error("Gym owner not found. Please run seedUsers first.");
	}

	const gyms = await Gym.insertMany([
		{
			name: "Downtown Fitness Center",
			address: "123 Main Street, Cityville",
			contactEmail: "contact@downtownfitness.com",
			contactPhone: "123-456-7890",
			description: "Spacious gym with modern equipment and classes.",
			ownerId: gymOwner._id,
			isApproved: true,
		},
		{
			name: "Elite Gym Club",
			address: "456 High Street, Townsville",
			contactEmail: "info@elitegymclub.com",
			contactPhone: "987-654-3210",
			description: "Premium training facilities with personal coaching.",
			ownerId: gymOwner._id,
			isApproved: true,
		},
	]);

	console.log(`Seeded ${gyms.length} gyms for gym owner: ${gymOwner.email}`);
	return gyms;
};
