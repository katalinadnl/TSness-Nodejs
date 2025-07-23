import mongoose, { Schema, type Document, type Types } from "mongoose";
import { DifficultyLevel } from "./common/enums";

export interface CreateTrainingRoomRequest {
	name: string;
	capacity: number;
	equipment: string[];
	features: string[];
	difficultyLevel: DifficultyLevel;
	assignedExerciseTypeId?: string;
	gymId: string;
	owner: string | Types.ObjectId;
}

export interface UpdateTrainingRoomRequest {
	name?: string;
	capacity?: number;
	equipment?: string[];
	features?: string[];
	difficultyLevel?: DifficultyLevel;
	assignedExerciseTypeId?: string;
	owner?: string | Types.ObjectId;
}
export interface ITrainingRoom {
	id: string;
	name: string;
	capacity: number;
	equipment: string[];
	features: string[];
	isApproved: boolean;
	difficultyLevel: DifficultyLevel;
	assignedExerciseTypeId?: Types.ObjectId;
	gymId: Types.ObjectId;
	owner: string | Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface TrainingRoomDocument
	extends Omit<ITrainingRoom, "id">,
		Document {}

const trainingRoomSchema = new Schema<TrainingRoomDocument>(
	{
		name: {
			type: String,
			required: [true, "Training room name is required"],
			trim: true,
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
		capacity: {
			type: Number,
			required: [true, "Capacity is required"],
			min: [1, "Capacity must be at least 1"],
			max: [500, "Capacity cannot exceed 500"],
		},
		equipment: {
			type: [String],
			default: [],
		},
		features: {
			type: [String],
			default: [],
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
		difficultyLevel: {
			type: String,
			enum: Object.values(DifficultyLevel),
			required: [true, "Difficulty level is required"],
		},
		assignedExerciseTypeId: {
			type: Schema.Types.ObjectId,
			ref: "ExerciseType",
			default: null,
		},
		gymId: {
			type: Schema.Types.ObjectId,
			ref: "Gym",
			required: [true, "GymId is required"],
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

trainingRoomSchema.index({ name: 1 });
trainingRoomSchema.index({ isApproved: 1 });
trainingRoomSchema.index({ difficultyLevel: 1 });
trainingRoomSchema.index({ assignedExerciseTypeId: 1 });

export const TrainingRoom = mongoose.model<TrainingRoomDocument>(
	"TrainingRoom",
	trainingRoomSchema,
);
