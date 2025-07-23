import mongoose, { type Document, Schema } from "mongoose";

export interface IGym extends Document {
	name: string;
	address: string;
	contactEmail: string;
	contactPhone?: string;
	description?: string;
	ownerId: mongoose.Types.ObjectId;
	isApproved: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
			unique: true,
		},
		address: {
			type: String,
			required: true,
			trim: true,
		},
		contactEmail: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		contactPhone: {
			type: String,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 500,
		},
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

GymSchema.index({ isApproved: 1 });

export const Gym = mongoose.model<IGym>("Gym", GymSchema);
