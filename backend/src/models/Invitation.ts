import mongoose, { Document, Schema } from 'mongoose';
import { InvitationStatus } from "./common/enums";

export interface IInvitation extends Document {
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    challengeId: mongoose.Types.ObjectId;
    status: InvitationStatus;
    createdAt: Date;
    updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiverId: {
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
            enum: Object.values(InvitationStatus),
            default: InvitationStatus.PENDING,
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

InvitationSchema.index({ senderId: 1, receiverId: 1, challengeId: 1 }, { unique: true });

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
