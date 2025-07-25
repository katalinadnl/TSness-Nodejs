import express, { type Request, type Response, type Router } from "express";
import type { ChallengeService } from "../services/challengeService";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../models/common/enums";

export class ChallengeController {
	constructor(private readonly challengeService: ChallengeService) {}

	async createChallenge(req: Request, res: Response): Promise<void> {
		try {
			const creatorId = req.user!._id.toString();
			const creatorRole = req.user!.role;
			const challenge = await this.challengeService.createChallenge(
				req.body,
				creatorId,
				creatorRole,
			);
			res.status(201).json({
				success: true,
				message: "challenge created successfully",
				data: challenge,
			});
		} catch (error) {
			res.status(400).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async getMyChallenges(req: Request, res: Response): Promise<void> {
		try {
			const ownerId = req.user!._id.toString();
			const challenges =
				await this.challengeService.getChallengesByOwner(ownerId);

			res.status(200).json({
				success: true,
				count: challenges.length,
				data: challenges,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async getAll(req: Request, res: Response): Promise<void> {
		try {
			const filters = req.query;
			const challenges = await this.challengeService.getAllChallenges(filters);

			res.status(200).json({
				success: true,
				count: challenges.length,
				data: challenges,
			});
		} catch (error) {
			res
				.status(500)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async participate(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user!._id.toString();
			const userRole = req.user!.role;

			const challengeId = req.params.id;
			const challenge = await this.challengeService.participateInChallenge(
				challengeId,
				userId,
			);

			res.status(200).json({
				success: true,
				message: "participation saved",
				data: challenge,
			});
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async updateProgress(req: Request, res: Response): Promise<void> {
		try {
			const challengeId = req.params.id;
			const userId = req.user!._id.toString();
			const challenge = await this.challengeService.updateProgress(
				challengeId,
				userId,
				req.body,
			);
			res.status(200).json({
				success: true,
				message: "Progression updated",
				data: challenge,
			});
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async getMySessions(req: Request, res: Response): Promise<void> {
		try {
			const challengeId = req.params.id;
			const userId = req.user!._id.toString();
			const result = await this.challengeService.getMySessions(
				challengeId,
				userId,
			);
			res.status(200).json({ success: true, data: result });
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async deleteChallenge(req: Request, res: Response): Promise<void> {
		try {
			const challengeId = req.params.id;
			const userId = req.user!._id.toString();
			const userRole = req.user!.role;

			await this.challengeService.deleteChallenge(
				challengeId,
				userId,
				userRole,
			);
			res
				.status(200)
				.json({ success: true, message: "challenge deleted successfully" });
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async shareChallenge(req: Request, res: Response): Promise<void> {
		try {
			const challengeId = req.params.id;
			const { userIds } = req.body;
			if (!Array.isArray(userIds) || userIds.length === 0) {
				res.status(400).json({ success: false, message: "no user to invite" });
				return;
			}
			const challenge = await this.challengeService.shareChallenge(
				challengeId,
				userIds,
			);
			res.status(200).json({
				success: true,
				message: "Challenge shared successfully.",
				data: challenge,
			});
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	buildRoutes(): Router {
		const router = express.Router();

		router.use(authenticateToken);

		router.get("/", this.getAll.bind(this));
		router.post("/", this.createChallenge.bind(this));
		router.get("/mine", this.getMyChallenges.bind(this));
		router.post(
			"/:id/participate",
			requireRole([UserRole.CLIENT]),
			this.participate.bind(this),
		);
		router.patch(
			"/:id/progress",
			requireRole([UserRole.CLIENT]),
			this.updateProgress.bind(this),
		);
		router.get(
			"/:id/sessions",
			requireRole([UserRole.CLIENT]),
			this.getMySessions.bind(this),
		);
		router.delete("/:id", this.deleteChallenge.bind(this));
		router.post("/:id/share", this.shareChallenge.bind(this));

		return router;
	}
}
