import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from './common/enums';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    score: number;
}

const UserSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.CLIENT
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    score: {
        type: Number,
        default: 0
    },

}, {
    timestamps: true
});

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1, isDeleted: 1 });

UserSchema.pre(/^find/, function(this: any) {
    this.find({ isDeleted: { $ne: true } });
});

export const User = mongoose.model<IUser>('User', UserSchema);