import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';
import { LocationSchema } from './location';

const VerificationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  frontCccd: { type: String },
  backCccd: { type: String },
  selfie: { type: String },
  notes: { type: String }
}
, { timestamps: true });


const AccountSchema = new Schema({
    email: { 
        type: String, 
        unique: true, 
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    avatar: String,
    fullname: { 
        type: String,
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    phone: { 
        type: String,
        match: [/^[0-9]{10,11}$/, 'Please enter a valid phone number']
    },
    address: { 
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    location: LocationSchema,
    identityImages: [String],
    identityNumber: { 
        type: String, 
        unique: true, 
        sparse: true,
        trim: true
    },
    identityFullname: { 
        type: String,
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    bio: { 
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    wallet: { 
        type: Number, 
        default: 0,
        min: [0, 'Wallet balance cannot be negative']
    },
    role: { 
        type: String, 
        enum: ['renter', 'owner', 'moderator', 'admin'],
        default: 'renter'
    },
    credit: { 
        type: String, 
        enum: ['trusted', 'restricted'], 
        default: 'trusted' 
    },

    verifications: [VerificationSchema],
    status: { 
        type: String, 
        enum: ['active', 'unverified', 'banned'],  
        default: 'unverified' 
    },
}, {
    timestamps: true
});

export type AccountType = InferSchemaType<typeof AccountSchema> & Document;

export const AccountModel = mongoose.models.Account || mongoose.model<AccountType>('Account', AccountSchema);