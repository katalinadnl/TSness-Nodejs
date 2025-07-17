import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipation extends Document {
    userId: mongoose.Types.ObjectId;
    challengeId: mongoose.Types.ObjectId;
    status: 'invited' | 'accepted' | 'completed';
    progress: number;
    caloriesBurned: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ParticipationSchema = new Schema<IParticipation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        challengeId: {
            type: Schema.Types.ObjectId,
            ref: 'Challenge',
            required: true
        },
        status: {
            type: String,
            enum: ['invited', 'accepted', 'completed'],
            default: 'invited'
        },
        progress: {
            type: Number,
            default: 0
        },
        caloriesBurned: {
            type: Number,
            default: 0
        },
        startedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

ParticipationSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

export const Participation = mongoose.model<IParticipation>('Participation', ParticipationSchema);
