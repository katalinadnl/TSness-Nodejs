import type { Request, Response, NextFunction } from "express";

export const notFoundHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.originalUrl} not found`,
	});
};

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	console.error("Error:", err.message);

	res.status(500).json({
		success: false,
		message: "Internal server error",
		error:
			process.env.NODE_ENV === "development"
				? err.message
				: "Something went wrong",
	});
};

export const validateObjectId = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const { id } = req.params;

	if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
		return res.status(400).json({
			success: false,
			message: "Invalid ID format",
		});
	}

	next();
};
