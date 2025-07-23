import { Gym } from "../models/Gym";
import { UserRole } from "../models/common/enums";
import { User } from "../models/User";

export const seedGyms = async () => {
	console.log("Seeding gyms...");

	await Gym.deleteMany({});

	// Récupère tous les gymowners
	const gymowners = await User.find({ role: UserRole.GYM_OWNER });
	if (!gymowners || gymowners.length === 0) {
		throw new Error("No gymowners found. Please run seedUsers first.");
	}

	// Génère 10 gyms répartis entre les gymowners
	const gymsData = [];
	for (let i = 1; i <= 5; i++) {
		const owner = gymowners[(i - 1) % gymowners.length];
		gymsData.push({
			name: `Gym ${i}`,
			address: `${i} rue du Sport, Ville${i}`,
			contactEmail: `contact${i}@gym${i}.com`,
			contactPhone: `01020304${i < 10 ? "0" + i : i}`,
			description: `Salle de sport moderne n°${i} avec équipements variés.`,
			ownerId: owner._id,
			isApproved: true,
		});
	}
	const gyms = await Gym.insertMany(gymsData);
	console.log(
		`Seeded ${gyms.length} gyms répartis entre ${gymowners.length} gymowners.`,
	);
	return gyms;
};
