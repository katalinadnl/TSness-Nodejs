import { Invitation } from "../models/Invitation";
import { User } from "../models/User";
import { Challenge } from "../models/Challenge";
import { InvitationStatus } from "../models/common/enums";

export const seedInvitations = async () => {
	await Invitation.deleteMany({});

	const users = await User.find({});
	const challenges = await Challenge.find({});
	if (users.length < 2 || challenges.length === 0) return;

	let invitations = [];
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
};
