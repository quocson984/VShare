import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const UserSchema = new Schema({
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
UserSchema.index({ email: 1 });

export type UserType = InferSchemaType<typeof UserSchema> & Document;

export const UserModel = mongoose.models.User || mongoose.model<UserType>('User', UserSchema);