import { Invitation } from "../models/Invitation";
import { User } from "../models/User";
import { Challenge } from "../models/Challenge";
import { InvitationStatus } from "../models/common/enums";

export const seedInvitations = async () => {
	console.log("Seeding invitations...");
	await Invitation.deleteMany({});

	const users = await User.find({});
	const challenges = await Challenge.find({});
	if (users.length < 2 || challenges.length === 0) return;

	let invitations = [];
	// Génère 20 invitations entre utilisateurs sur différents challenges
	for (let i = 0; i < 15; i++) {
		const sender = users[i % users.length];
		const receiver = users[(i + 1) % users.length];
		const challenge = challenges[i % challenges.length];
		invitations.push({
			senderId: sender._id,
			receiverId: receiver._id,
			challengeId: challenge._id,
			status:
				i % 3 === 0
					? InvitationStatus.ACCEPTED
					: i % 3 === 1
						? InvitationStatus.PENDING
						: InvitationStatus.DECLINED,
		});
	}
	await Invitation.insertMany(invitations);
	console.log(`Seeded ${invitations.length} invitations.`);
};
