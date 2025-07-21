import mongoose, { Schema, Document } from 'mongoose';
import { ITrainingRoom, DifficultyLevel } from '../types';

export interface TrainingRoomDocument extends Omit<ITrainingRoom, 'id'>, Document {}

const trainingRoomSchema = new Schema<TrainingRoomDocument>(
  {
    name: {
      type: String,
      required: [true, 'Training room name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [500, 'Capacity cannot exceed 500']
    },
    equipment: {
      type: [String],
      default: []
    },
    features: {
      type: [String],
      default: []
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    difficultyLevel: {
      type: String,
      enum: Object.values(DifficultyLevel),
      required: [true, 'Difficulty level is required']
    },
    assignedExerciseTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'ExerciseType',
      default: null
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required']
    },
    createdBy: {
      type: String,
      required: [true, 'Creator is required'],
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

trainingRoomSchema.index({ name: 1 });
trainingRoomSchema.index({ isApproved: 1 });
trainingRoomSchema.index({ difficultyLevel: 1 });
trainingRoomSchema.index({ assignedExerciseTypeId: 1 });

export const TrainingRoom = mongoose.model<TrainingRoomDocument>('TrainingRoom', trainingRoomSchema);
