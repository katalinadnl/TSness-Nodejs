import { Participation } from "../models/Participation";
import { Challenge } from "../models/Challenge";
import { User } from "../models/User";
import { UserBadge } from "../models/UserBadge";
import { Badge } from "../models/Badge";
import { UserRole } from "../models/common/enums";

export const seedParticipations = async () => {
	console.log("Seeding participations...");

	await Participation.deleteMany({});
	const clients = await User.find({ role: UserRole.CLIENT });
	const allChallenges = await Challenge.find({});
	let totalParticipations = 0;
	for (const client of clients) {
		let completedCount = 0;
		for (let i = 0; i < 5; i++) {
			const challenge =
				allChallenges[
					(client._id.toString().charCodeAt(0) + i) % allChallenges.length
				];

			let status = i % 2 === 0 ? "completed" : "accepted";
			if (client.username === "client1" && completedCount < 3) {
				status = "completed";
				completedCount++;
			}
			const progress =
				status === "completed" ? 100 : Math.floor(Math.random() * 80);
			const caloriesBurned = 100 + Math.floor(Math.random() * 400);
			const sessions = [
				{
					date: new Date(),
					progress,
					caloriesBurned,
				},
			];
			const alreadyExists = await Participation.findOne({
				userId: client._id,
				challengeId: challenge._id,
			});
			if (!alreadyExists) {
				await Participation.create({
					userId: client._id,
					challengeId: challenge._id,
					status,
					progress,
					caloriesBurned,
					startedAt: new Date(),
					completedAt: status === "completed" ? new Date() : null,
					sessions,
				});
				await Challenge.findByIdAndUpdate(challenge._id, {
					$push: {
						participants: {
							userId: client._id,
							status,
							progress,
							caloriesBurned,
						},
					},
				});
				totalParticipations++;
			}
		}
	}
	console.log(
		`Seeded ${totalParticipations} participations pour ${clients.length} clients.`,
	);

	const allBadges = await Badge.find();

	const assignBadges = async (user: any) => {
		const completedCount = await Participation.countDocuments({
			userId: user._id,
			status: "completed",
		});
		for (const badge of allBadges) {
			const condition = badge.rule.replace(
				/completedChallenges/g,
				completedCount.toString(),
			);
			const isEarned = eval(condition);
			if (isEarned) {
				const alreadyHas = await UserBadge.findOne({
					userId: user._id,
					badgeId: badge._id,
				});
				if (!alreadyHas) {
					await UserBadge.create({
						userId: user._id,
						badgeId: badge._id,
						earnedAt: new Date(),
					});
				}
			}
		}
	};

	for (const client of clients) {
		await assignBadges(client);
	}

	console.log("Participations et badges attribués dynamiquement");
};
