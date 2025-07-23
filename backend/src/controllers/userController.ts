import express, { type Request, type Response, Router } from "express";
import type { UserService } from "../services/userService";
import type { Error } from "mongoose";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { UserRole } from "../models/common/enums";

export class UserController {
	constructor(readonly userService: UserService) {
		this.userService = userService;
	}

	async getAllUsers(req: Request, res: Response): Promise<void> {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const filters = {
				role: req.query.role as string,
				isActive: req.query.isActive
					? req.query.isActive === "true"
					: undefined,
				search: req.query.search as string,
				requestingRole: req.user?.role,
			};

			const result = await this.userService.getAllUsers(page, limit, filters);

			res.status(200).json({
				success: true,
				message: "user retrieved successfully",
				data: result,
			});
		} catch (error) {
			console.error("error while fetching the users:", error);
			res.status(500).json({
				success: false,
				message: "internal error",
				error: (error as Error).message,
			});
		}
	}

	async getUserById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const user = await this.userService.getUserById(id);

			res.status(200).json({
				success: true,
				message: "user retrieved successfully",
				data: { user },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async deactivateUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const adminId = req.user?._id.toString();

			if (!adminId) {
				res.status(401).json({
					success: false,
					message: "Auth required",
				});
				return;
			}

			const result = await this.userService.deactivateUser(id, adminId);

			res.status(200).json({
				success: true,
				message: result.message,
				data: { user: result.user },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: (error as Error).message.includes("you cannot")
						? 403
						: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async activateUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const result = await this.userService.activateUser(id);

			res.status(200).json({
				success: true,
				message: result.message,
				data: { user: result.user },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async deleteUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const adminId = req.user?._id.toString();

			if (!adminId) {
				res.status(401).json({
					success: false,
					message: "you must be authenticated",
				});
				return;
			}

			const result = await this.userService.deleteUser(id, adminId);

			res.status(200).json({
				success: true,
				message: result.message,
				data: { user: result.user },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: (error as Error).message.includes("you cannot")
						? 403
						: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async permanentDeleteUser(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const adminId = req.user?._id.toString();

			if (!adminId) {
				res.status(401).json({
					success: false,
					message: "you must be authenticated",
				});
				return;
			}

			const result = await this.userService.permanentDeleteUser(id, adminId);

			res.status(200).json({
				success: true,
				message: result.message,
				data: { userId: result.userId },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: (error as Error).message.includes("you cannot")
						? 403
						: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	async getUserStats(req: Request, res: Response): Promise<void> {
		try {
			const stats = await this.userService.getUserStats();

			res.status(200).json({
				success: true,
				message: "statistics retrieved successfully",
				data: { stats },
			});
		} catch (error) {
			console.error("statistics not fetched:", error);
			res.status(500).json({
				success: false,
				message: "internal error",
				error: (error as Error).message,
			});
		}
	}

	async createClient(req: Request, res: Response) {
		try {
			const user = await this.userService.createClient(req.body);
			res
				.status(201)
				.json({ success: true, message: "Client created", data: { user } });
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async createGymOwner(req: Request, res: Response) {
		try {
			const user = await this.userService.createGymOwner(req.body);
			res
				.status(201)
				.json({ success: true, message: "owner gym created", data: { user } });
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async createSuperAdmin(req: Request, res: Response) {
		try {
			const user = await this.userService.createSuperAdmin(req.body);
			res
				.status(201)
				.json({ success: true, message: "Admin created", data: { user } });
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async updateOwnProfile(req: Request, res: Response) {
		try {
			const updated = await this.userService.updateOwnProfile(
				req.user!._id.toString(),
				req.body,
			);
			res
				.status(200)
				.json({
					success: true,
					message: "update profile",
					data: { user: updated },
				});
		} catch (error) {
			res
				.status(400)
				.json({ success: false, message: (error as Error).message });
		}
	}

	async updateUser(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.params.id;
			const adminId = req.user!._id.toString();
			const updates = req.body;

			const updatedUser = await this.userService.updateUserByAdmin(
				userId,
				updates,
				adminId,
			);

			res.status(200).json({
				success: true,
				message: "User updated successfully",
				data: { user: updatedUser },
			});
		} catch (error) {
			const statusCode =
				(error as Error).message.includes("invalid") ||
				(error as Error).message.includes("not found")
					? 404
					: (error as Error).message.includes("You cannot")
						? 403
						: 500;

			res.status(statusCode).json({
				success: false,
				message: (error as Error).message,
			});
		}
	}

	buildRoutes() {
		const router = express.Router();

		router.use(authenticateToken);

		router.get(
			"/stats",
			requireRole([UserRole.SUPER_ADMIN]),
			this.getUserStats.bind(this),
		);
		router.delete(
			"/:id/permanent",
			requireRole([UserRole.SUPER_ADMIN]),
			this.permanentDeleteUser.bind(this),
		);
		router.get(
			"/",
			requireRole([UserRole.SUPER_ADMIN]),
			this.getAllUsers.bind(this),
		);
		router.get(
			"/:id",
			requireRole([UserRole.SUPER_ADMIN]),
			this.getUserById.bind(this),
		);
		router.put(
			"/:id/deactivate",
			requireRole([UserRole.SUPER_ADMIN]),
			this.deactivateUser.bind(this),
		);
		router.put(
			"/:id/activate",
			requireRole([UserRole.SUPER_ADMIN]),
			this.activateUser.bind(this),
		);
		router.delete(
			"/:id",
			requireRole([UserRole.SUPER_ADMIN]),
			this.deleteUser.bind(this),
		);
		router.post(
			"/create-client",
			requireRole([UserRole.SUPER_ADMIN]),
			this.createClient.bind(this),
		);
		router.post(
			"/create-gym-owner",
			requireRole([UserRole.SUPER_ADMIN]),
			this.createGymOwner.bind(this),
		);
		router.post(
			"/create-admin",
			requireRole([UserRole.SUPER_ADMIN]),
			this.createSuperAdmin.bind(this),
		);
		router.put(
			"/:id",
			requireRole([UserRole.SUPER_ADMIN]),
			this.updateUser.bind(this),
		);
		router.put("/me", this.updateOwnProfile.bind(this));

		return router;
	}
}
