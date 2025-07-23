import mongoose, { Schema, Document } from 'mongoose';

export interface ExerciseType {
  id: string;
  name: string;
  description: string;
  targetedMuscles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateExerciseTypeRequest {
  name: string;
  description: string;
  targetedMuscles: string[];
}

export interface UpdateExerciseTypeRequest {
  name?: string;
  description?: string;
  targetedMuscles?: string[];
}


export interface ExerciseTypeDocument extends Omit<ExerciseType, 'id'>, Document {}

const exerciseTypeSchema = new Schema<ExerciseTypeDocument>(
  {
    name: {
      type: String,
      required: [true, 'Exercise type name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    targetedMuscles: {
      type: [String],
      required: [true, 'At least one targeted muscle is required'],
      validate: {
        validator: function(muscles: string[]) {
          return muscles && muscles.length > 0;
        },
        message: 'At least one targeted muscle must be specified'
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

exerciseTypeSchema.index({ name: 1 });
exerciseTypeSchema.index({ targetedMuscles: 1 });

export const ExerciseType = mongoose.model<ExerciseTypeDocument>('ExerciseType', exerciseTypeSchema);
