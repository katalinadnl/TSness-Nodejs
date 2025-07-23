import express, { type Request, type Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export class LoginController {
	async signin(req: Request, res: Response): Promise<void> {
		try {
			const username = req.body.username;
			const admin = await User.findOne({ username: username }).select(
				"_id username email role password isActive isDeleted",
			);

			if (!admin) {
				res.status(404).json({
					success: false,
					message: "No user found",
				});
				return;
			}

			const jwtSecret = process.env.JWT_SECRET;
			if (!jwtSecret) {
				res.status(500).json({
					success: false,
					message: "JWT_SECRET not configured",
				});
				return;
			}

			const password = req.body.password;
			const adminPassword = admin.password;
			const result = bcrypt.compareSync(password, adminPassword);

			if (!result) {
				res.status(401).json({
					success: false,
					message: "Password incorrect",
				});
				return;
			}

			const token = jwt.sign(
				{
					userId: admin._id,
					role: admin.role,
				},
				jwtSecret,
				{ expiresIn: "24h" },
			);

			res.json({
				success: true,
				token: token,
				message: "Login successful",
				admin: {
					id: admin._id,
					username: admin.username,
					email: admin.email,
					role: admin.role,
				},
			});
		} catch (error) {
			console.error("Error :", error);
			res.status(500).json({
				success: false,
				message: "Internal server error -> could not sign in and make a tocken",
				error: (error as Error).message,
			});
		}
	}

	verifyToken(req: Request, res: Response): void {
		const authHeader = req.headers["authorization"];
		const token = authHeader && authHeader.split(" ")[1];

		if (!token) {
			res.status(401).json({
				success: false,
				message: "Token missing or invalid",
			});
			return;
		}

		try {
			const jwtSecret = process.env.JWT_SECRET;
			if (!jwtSecret) {
				res.status(500).json({
					success: false,
					message: "JWT_SECRET not configured",
				});
				return;
			}

			const decoded = jwt.verify(token, jwtSecret) as {
				userId: string;
				role: string;
			};
			res.json({
				success: true,
				message: "tocken is valid",
				decoded: decoded,
			});
		} catch (error) {
			res.status(403).json({
				success: false,
				message: "Token invalid or expired",
				error: (error as Error).message,
			});
		}
	}

	buildRoutes() {
		const router = express.Router();

		router.post("/signin", this.signin.bind(this));
		router.get("/verify-token", this.verifyToken.bind(this));

		return router;
	}
}
