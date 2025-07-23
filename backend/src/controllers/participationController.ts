import express, { type Request, type Response, type Router } from "express";
import mongoose from "mongoose";
import { Participation } from "../models/Participation";
import { Challenge } from "../models/Challenge";
import { authenticateToken, type JwtUser } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../models/common/enums";

export class ParticipationController {
	async getAll(req: Request, res: Response) {
		try {
			const participations = await Participation.find()
				.populate("userId", "username email")
				.populate("challengeId", "title");

			res
				.status(200)
				.json({
					success: true,
					count: participations.length,
					data: participations,
				});
		} catch (error) {
			res.status(500).json({ message: "server error", error });
		}
	}

	async getMine(req: Request, res: Response) {
		try {
			const user = req.user as JwtUser;

			const participations = await Participation.find({
				userId: user._id,
			}).populate("challengeId", "title description duration");

			res
				.status(200)
				.json({
					success: true,
					count: participations.length,
					data: participations,
				});
		} catch (error) {
			res.status(500).json({ message: "Server error", error });
		}
	}

	async deleteMine(req: Request, res: Response) {
		try {
			const user = req.user as JwtUser;
			const { id } = req.params;

			if (!mongoose.Types.ObjectId.isValid(id))
				return res.status(400).json({ message: "invalid id" });

			const participation = await Participation.findById(id);
			if (!participation)
				return res.status(404).json({ message: "Participation not found" });

			if (!participation.userId.equals(user._id)) {
				return res
					.status(403)
					.json({ message: "You can't delete this participation" });
			}

			await Challenge.findByIdAndUpdate(participation.challengeId, {
				$pull: { participants: { userId: participation.userId } },
			});

			await Participation.findByIdAndDelete(id);

			res.status(200).json({ success: true, message: "Participation deleted" });
		} catch (error) {
			res.status(500).json({ message: "server error", error });
		}
	}

	async getForGymOwner(req: Request, res: Response) {
		try {
			const user = req.user as JwtUser;

			const challenges = await Challenge.find({ creatorId: user._id });
			const challengeIds = challenges.map((c) => c._id);

			const participations = await Participation.find({
				challengeId: { $in: challengeIds },
			})
				.populate("userId", "username email")
				.populate("challengeId", "title");

			res
				.status(200)
				.json({
					success: true,
					count: participations.length,
					data: participations,
				});
		} catch (error) {
			res.status(500).json({ message: "server error", error });
		}
	}

	buildRoutes(): Router {
		const router = express.Router();

		router.use(authenticateToken);

		router.get(
			"/",
			requireRole([UserRole.SUPER_ADMIN]),
			this.getAll.bind(this) as express.RequestHandler,
		);
		router.get(
			"/me",
			requireRole([UserRole.CLIENT]),
			this.getMine.bind(this) as express.RequestHandler,
		);
		router.delete("/:id", this.deleteMine.bind(this) as express.RequestHandler);
		router.get(
			"/gym-owner/mine",
			requireRole([UserRole.GYM_OWNER]),
			this.getForGymOwner.bind(this) as express.RequestHandler,
		);

		return router;
	}
}
