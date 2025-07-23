import express, { type Request, type Response, type Router } from "express";
import { Invitation } from "../models/Invitation";
import mongoose from "mongoose";

export class InvitationController {
	async createInvitation(req: Request, res: Response): Promise<void> {
		try {
			const invitation = new Invitation(req.body);
			const saved = await invitation.save();
			res.status(201).json(saved);
		} catch (error) {
			console.error(error);
			res.status(400).json({ message: "Error creating invitation", error });
		}
	}

	async getAllInvitations(req: Request, res: Response): Promise<void> {
		try {
			const invitations = await Invitation.find()
				.populate("senderId", "username email")
				.populate("receiverId", "username email")
				.populate("challengeId", "title");
			res.status(200).json(invitations);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error fetching invitations", error });
		}
	}

	async getInvitationById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ message: "Invalid ID format" });
				return;
			}

			const invitation = await Invitation.findById(id)
				.populate("senderId", "username email")
				.populate("receiverId", "username email")
				.populate("challengeId", "title");
			if (!invitation) {
				res.status(404).json({ message: "Invitation not found" });
				return;
			}

			res.status(200).json(invitation);
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error fetching invitation", error });
		}
	}

	async updateInvitation(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ message: "Invalid ID format" });
				return;
			}

			const updated = await Invitation.findByIdAndUpdate(id, req.body, {
				new: true,
				runValidators: true,
			});
			if (!updated) {
				res.status(404).json({ message: "Invitation not found" });
				return;
			}

			res.status(200).json(updated);
		} catch (error) {
			console.error(error);
			res.status(400).json({ message: "Error updating invitation", error });
		}
	}

	async deleteInvitation(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ message: "Invalid ID format" });
				return;
			}

			const deleted = await Invitation.findByIdAndDelete(id);
			if (!deleted) {
				res.status(404).json({ message: "Invitation not found" });
				return;
			}

			res.status(200).json({ message: "Invitation deleted successfully" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Error deleting invitation", error });
		}
	}

	buildRoutes(): Router {
		const router = express.Router();
		router.get("/", this.getAllInvitations.bind(this));
		router.get("/:id", this.getInvitationById.bind(this));
		router.post("/", this.createInvitation.bind(this));
		router.put("/:id", this.updateInvitation.bind(this));
		router.delete("/:id", this.deleteInvitation.bind(this));

		return router;
	}
}
