import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBadge extends Document {
    userId: string;
    badgeId: mongoose.Types.ObjectId;
    earnedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userBadgeSchema = new Schema<IUserBadge>({
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        trim: true
    },
    badgeId: {
        type: Schema.Types.ObjectId,
        ref: 'Badge',
        required: [true, 'Badge ID is required']
    },
    earnedAt: {
        type: Date,
        default: Date.now,
        required: [true, 'Earned date is required']
    }
}, {
    timestamps: true,
    versionKey: false
});

userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1 });
userBadgeSchema.index({ badgeId: 1 });
userBadgeSchema.index({ earnedAt: -1 });

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);