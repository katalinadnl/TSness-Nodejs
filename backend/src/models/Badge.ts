import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
    name: string;
    description: string;
    iconUrl?: string;
    rule: string;
    createdAt: Date;
    updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>({
    name: {
        type: String,
        required: [true, 'Badge name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    iconUrl: {
        type: String,
        default: ''
    },
    rule: {
        type: String,
        required: [true, 'Rule is required'],
        trim: true,
        maxlength: [1000, 'Rule cannot exceed 1000 characters']
    }
}, {
    timestamps: true,
    versionKey: false
});

badgeSchema.index({ name: 1 });

export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
