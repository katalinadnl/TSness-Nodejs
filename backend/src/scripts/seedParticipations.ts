import { Participation } from "../models/Participation";
import { Challenge } from "../models/Challenge";
import { User } from "../models/User";
import { UserBadge } from "../models/UserBadge";
import { Badge } from "../models/Badge";

export const seedParticipations = async () => {
	console.log("Seeding participations...");

	await Participation.deleteMany({});
	await UserBadge.deleteMany({});

	const client = await User.findOne({ email: "client@example.com" });
	const client2 = await User.findOne({ email: "client2@example.com" });

	const allChallenges = await Challenge.find({});

	if (!client || !client2 || allChallenges.length === 0) {
		throw new Error(
			"Clients or challenges not found. Make sure to seed users and challenges first.",
		);
	}

	await Challenge.updateMany({}, { $set: { participants: [] } });

	const generateParticipation = async (user: any, challengeSubset: any[]) => {
		for (const challenge of challengeSubset) {
			const sessions = [
				{
					date: new Date(),
					progress: 100,
					caloriesBurned: 200,
				},
			];

			await Participation.create({
				userId: user._id,
				challengeId: challenge._id,
				status: "completed",
				progress: 100,
				caloriesBurned: 200,
				startedAt: new Date(),
				completedAt: new Date(),
				sessions,
			});

			await Challenge.findByIdAndUpdate(challenge._id, {
				$push: {
					participants: {
						userId: user._id,
						status: "completed",
						progress: 100,
						caloriesBurned: 200,
					},
				},
			});
		}
	};

	await generateParticipation(client, allChallenges.slice(0, 1));

	await generateParticipation(client2, allChallenges.slice(0, 5));

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

	await assignBadges(client);
	await assignBadges(client2);

	console.log("Participations et badges attribués dynamiquement");
};
