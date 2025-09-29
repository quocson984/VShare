import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';
import { LocationSchema } from './location';

const EquipmentSchema = new Schema({
    title: { 
        type: String, 
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    brand: { 
        type: String,
        trim: true
    },
    model: { 
        type: String,
        trim: true
    },
    description: { 
        type: String,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    images: [String],
    category: { 
        type: String, 
        enum: ['camera', 'lens', 'lighting', 'audio', 'accessory'], 
        required: [true, 'Category is required']
    },
    quantity: { 
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    location: LocationSchema,
    specs: [{
        name: { type: String, required: true },
        value: { type: String, required: true }
    }],
    pricePerDay: { 
        type: Number,
        required: [true, 'Price per day is required'],
        min: [0, 'Price cannot be negative']
    },
    pricePerWeek: { 
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    pricePerMonth: { 
        type: Number,
        min: [0, 'Price cannot be negative']
    },
    replacementPrice: { 
        type: Number,
        required: [true, 'Replacement price is required'],
        min: [0, 'Price cannot be negative']
    },
    deposit: { 
        type: Number,
        default: 0,
        min: [0, 'Deposit cannot be negative']
    },
    status: { 
        type: String, 
        enum: ['available', 'unavailable'], 
        default: 'available' 
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account',
        required: [true, 'Owner ID is required']
    }
}, {
    timestamps: true
})

export type EquipmentType = InferSchemaType<typeof EquipmentSchema> & Document;

export const EquipmentModel = mongoose.models.Equipment || mongoose.model<EquipmentType>('Equipment', EquipmentSchema);
