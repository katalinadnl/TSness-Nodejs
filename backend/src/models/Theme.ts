import mongoose, { Document, Schema } from 'mongoose';

export interface ITheme extends Document {
    name: string;
    description: string;
    slug: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        backgroundSoft: string;
        text: string;
        textMuted: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const themeSchema = new Schema<ITheme>({
    name: {
        type: String,
        required: [true, 'Theme name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
    },
    colors: {
        primary: {
            type: String,
            required: [true, 'Primary color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color']
        },
        secondary: {
            type: String,
            required: [true, 'Secondary color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color']
        },
        accent: {
            type: String,
            required: [true, 'Accent color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Accent color must be a valid hex color']
        },
        background: {
            type: String,
            required: [true, 'Background color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color']
        },
        backgroundSoft: {
            type: String,
            required: [true, 'Background soft color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Background soft color must be a valid hex color']
        },
        text: {
            type: String,
            required: [true, 'Text color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Text color must be a valid hex color']
        },
        textMuted: {
            type: String,
            required: [true, 'Text muted color is required'],
            match: [/^#[0-9A-Fa-f]{6}$/, 'Text muted color must be a valid hex color']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});


export const Theme = mongoose.model<ITheme>('Theme', themeSchema);