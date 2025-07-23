import mongoose, { Document, Schema } from 'mongoose';
import { DifficultyLevel, ChallengeGoal } from './common/enums';

export interface IChallengeParticipant {
    userId: mongoose.Types.ObjectId;
    status: 'invited' | 'accepted' | 'completed';
    progress: number;
    caloriesBurned: number;
}

export interface IChallenge extends Document {
    title: string;
    description: string;
    creatorId: mongoose.Types.ObjectId;
    gymId?: mongoose.Types.ObjectId;
    recommendedExerciseTypeIds: mongoose.Types.ObjectId[];
    duration: number; // in minutes
    difficultyLevel: string;
    goals: string;
    participants: IChallengeParticipant[];
    createdAt: Date;
    updatedAt: Date;
}

const ChallengeParticipantSchema = new Schema<IChallengeParticipant>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['invited', 'accepted', 'completed'],
            default: 'invited'
        },
        progress: { type: Number, default: 0 },
        caloriesBurned: { type: Number, default: 0 }
    },
    { _id: false }
);

const ChallengeSchema = new Schema<IChallenge>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: 'Gym',
            default: null
        },
        recommendedExerciseTypeIds: [{
            type: Schema.Types.ObjectId,
            ref: 'ExerciseType'
        }],
        duration: {
            type: Number,
            required: true,
            min: 1
        },
        difficultyLevel: {
            type: String,
            enum: Object.values(DifficultyLevel),
            required: true,
            trim: true
        },
        goals: {
            type: String,
            enum: Object.values(ChallengeGoal),
            required: true,
            trim: true
        },
        participants: {
            type: [ChallengeParticipantSchema],
            default: []
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

ChallengeSchema.index({ creatorId: 1 });
ChallengeSchema.index({ gymId: 1 });
ChallengeSchema.index({ difficultyLevel: 1 });

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
