import type { Request, Response } from "express";
import express from "express";
import {
	TrainingRoom,
	type CreateTrainingRoomRequest,
	type UpdateTrainingRoomRequest,
} from "../models/TrainingRoom";
import { ExerciseType } from "../models/ExerciseType";
import { DifficultyLevel, UserRole } from "../models/common/enums";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

export class TrainingRoomController {
	async getAllTrainingRooms(req: Request, res: Response): Promise<void> {
		try {
			const rooms = await TrainingRoom.find()
				.populate("assignedExerciseTypeId", "name description")
				.sort({ createdAt: -1 });

			res.status(200).json({
				success: true,
				count: rooms.length,
				data: rooms,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error fetching training rooms",
				error: (error as Error).message,
			});
		}
	}

	async getTrainingRoomById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const room = await TrainingRoom.findById(id).populate(
				"assignedExerciseTypeId",
				"name description targetedMuscles",
			);

			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: room,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error fetching training room",
				error: (error as Error).message,
			});
		}
	}

	async createTrainingRoom(req: Request, res: Response): Promise<void> {
		try {
			const {
				name,
				capacity,
				equipment,
				features,
				difficultyLevel,
				owner,
			}: CreateTrainingRoomRequest = req.body;

			if (
				!name ||
				!capacity ||
				!equipment ||
				!features ||
				!difficultyLevel ||
				!owner
			) {
				res.status(400).json({
					success: false,
					message: "All fields (including owner) are required",
				});
				return;
			}

			const existingRoom = await TrainingRoom.findOne({ name });
			if (existingRoom) {
				res.status(409).json({
					success: false,
					message: "Training room with this name already exists",
				});
				return;
			}

			const user = await require("../models/User").User.findById(owner);
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Owner (user) not found",
				});
				return;
			}

			const room = await TrainingRoom.create({
				name,
				capacity,
				equipment,
				features,
				difficultyLevel,
				owner,
				createdBy: req.user?._id || "system",
			});

			res.status(201).json({
				success: true,
				message: "Training room created successfully",
				data: room,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error creating training room",
				error: (error as Error).message,
			});
		}
	}

	async updateTrainingRoom(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const {
				name,
				capacity,
				equipment,
				features,
				difficultyLevel,
				assignedExerciseTypeId,
				owner,
			}: UpdateTrainingRoomRequest = req.body;

			if (
				!name &&
				!capacity &&
				!equipment &&
				!features &&
				!difficultyLevel &&
				!assignedExerciseTypeId &&
				!owner
			) {
				res.status(400).json({
					success: false,
					message: "At least one field is required for update",
				});
				return;
			}

			const existingRoom = await TrainingRoom.findById(id);
			if (!existingRoom) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			if (name && name !== existingRoom.name) {
				const duplicateRoom = await TrainingRoom.findOne({ name });
				if (duplicateRoom) {
					res.status(409).json({
						success: false,
						message: "Training room with this name already exists",
					});
					return;
				}
			}

			if (assignedExerciseTypeId) {
				const exerciseType = await ExerciseType.findById(
					assignedExerciseTypeId,
				);
				if (!exerciseType) {
					res.status(404).json({
						success: false,
						message: "Exercise type not found",
					});
					return;
				}
			}

			if (owner) {
				const user = await require("../models/User").User.findById(owner);
				if (!user) {
					res.status(404).json({
						success: false,
						message: "Owner (user) not found",
					});
					return;
				}
			}

			const updateData: Partial<UpdateTrainingRoomRequest> = {};
			if (name) updateData.name = name;
			if (capacity) updateData.capacity = capacity;
			if (equipment) updateData.equipment = equipment;
			if (features) updateData.features = features;
			if (difficultyLevel) updateData.difficultyLevel = difficultyLevel;
			if (assignedExerciseTypeId)
				updateData.assignedExerciseTypeId = assignedExerciseTypeId;
			if (owner) updateData.owner = owner;

			const updatedRoom = await TrainingRoom.findByIdAndUpdate(id, updateData, {
				new: true,
				runValidators: true,
			})
				.populate("assignedExerciseTypeId", "name description targetedMuscles")
				.populate("owner", "username email");

			res.status(200).json({
				success: true,
				message: "Training room updated successfully",
				data: updatedRoom,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error updating training room",
				error: (error as Error).message,
			});
		}
	}
	async changeOwner(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { owner } = req.body;

			if (!owner) {
				res.status(400).json({
					success: false,
					message: "Owner (userId) is required",
				});
				return;
			}

			const user = await require("../models/User").User.findById(owner);
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Owner (user) not found",
				});
				return;
			}

			const room = await TrainingRoom.findById(id);
			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			room.owner = owner;
			await room.save();

			res.status(200).json({
				success: true,
				message: "Owner changed successfully",
				data: room,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error changing owner",
				error: (error as Error).message,
			});
		}
	}

	async deleteTrainingRoom(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const room = await TrainingRoom.findById(id);
			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			await TrainingRoom.findByIdAndDelete(id);

			res.status(200).json({
				success: true,
				message: "Training room deleted successfully",
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error deleting training room",
				error: (error as Error).message,
			});
		}
	}

	async approveTrainingRoom(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;

			const room = await TrainingRoom.findById(id);
			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			const updatedRoom = await TrainingRoom.findByIdAndUpdate(
				id,
				{ isApproved: true },
				{ new: true },
			).populate("assignedExerciseTypeId", "name description targetedMuscles");

			res.status(200).json({
				success: true,
				message: "Training room approved successfully",
				data: updatedRoom,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error approving training room",
				error: (error as Error).message,
			});
		}
	}

	async assignExerciseType(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { exerciseTypeId } = req.body;

			if (!exerciseTypeId) {
				res.status(400).json({
					success: false,
					message: "Exercise type ID is required",
				});
				return;
			}

			const room = await TrainingRoom.findById(id);
			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			const exerciseType = await ExerciseType.findById(exerciseTypeId);
			if (!exerciseType) {
				res.status(404).json({
					success: false,
					message: "Exercise type not found",
				});
				return;
			}

			const updatedRoom = await TrainingRoom.findByIdAndUpdate(
				id,
				{ assignedExerciseTypeId: exerciseTypeId },
				{ new: true },
			).populate("assignedExerciseTypeId", "name description targetedMuscles");

			res.status(200).json({
				success: true,
				message: "Exercise type assigned successfully",
				data: updatedRoom,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error assigning exercise type",
				error: (error as Error).message,
			});
		}
	}

	async setDifficultyLevel(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			const { difficultyLevel } = req.body;

			if (
				!difficultyLevel ||
				!Object.values(DifficultyLevel).includes(difficultyLevel)
			) {
				res.status(400).json({
					success: false,
					message: "Valid difficulty level is required",
					validValues: Object.values(DifficultyLevel),
				});
				return;
			}

			const room = await TrainingRoom.findById(id);
			if (!room) {
				res.status(404).json({
					success: false,
					message: "Training room not found",
				});
				return;
			}

			const updatedRoom = await TrainingRoom.findByIdAndUpdate(
				id,
				{ difficultyLevel },
				{ new: true },
			).populate("assignedExerciseTypeId", "name description targetedMuscles");

			res.status(200).json({
				success: true,
				message: "Difficulty level updated successfully",
				data: updatedRoom,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error setting difficulty level",
				error: (error as Error).message,
			});
		}
	}

	buildRoutes() {
		const router = express.Router();

		router.use(authenticateToken);
		router.use(requireRole([UserRole.SUPER_ADMIN, UserRole.GYM_OWNER]));

		router.get("/", this.getAllTrainingRooms.bind(this));
		router.get("/:id", this.getTrainingRoomById.bind(this));
		router.post("/", this.createTrainingRoom.bind(this));
		router.put("/:id", this.updateTrainingRoom.bind(this));
		router.delete("/:id", this.deleteTrainingRoom.bind(this));
		router.patch("/:id/approve", this.approveTrainingRoom.bind(this));
		router.patch(
			"/:id/assign-exercise-type",
			this.assignExerciseType.bind(this),
		);
		router.patch("/:id/set-difficulty", this.setDifficultyLevel.bind(this));
		router.patch("/:id/change-owner", this.changeOwner.bind(this));

		return router;
	}
}
