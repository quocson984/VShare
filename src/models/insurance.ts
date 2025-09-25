import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const InsuranceSchema = new Schema({
    name: { 
        type: String,
        required: [true, 'Insurance name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    minCoverage: { 
        type: Number,
        required: [true, 'Minimum coverage is required'],
        min: [0, 'Coverage cannot be negative']
    },
    maxCoverage: { 
        type: Number,
        required: [true, 'Maximum coverage is required'],
        min: [0, 'Coverage cannot be negative']
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    }
}, {
    timestamps: true
});
export type InsuranceType = InferSchemaType<typeof InsuranceSchema> & Document;

export const InsuranceModel = mongoose.models.Insurance || mongoose.model<InsuranceType>('Insurance', InsuranceSchema);