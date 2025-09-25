import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const IncidentSchema = new Schema({
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking', 
        required: [true, 'Booking ID is required']
    },
    reporterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account', 
        required: [true, 'Reporter ID is required']
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    images: [String],
    type: { 
        type: String, 
        enum: ['damage', 'theft', 'late', 'other'], 
        required: [true, 'Incident type is required']
    },
    severity: { 
        type: String, 
        enum: ['minor', 'major', 'critical'], 
        required: [true, 'Severity is required']
    },
    status: { 
        type: String, 
        enum: ['pending', 'resolved', 'rejected'], 
        default: 'pending' 
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    resolvedByInsuranceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Insurance' 
    },
    resolutionAmount: {
        type: Number,
        min: [0, 'Resolution amount cannot be negative']
    }
}, {
    timestamps: true
});

export type IncidentType = InferSchemaType<typeof IncidentSchema> & Document;

export const IncidentModel = mongoose.models.Incident || mongoose.model<IncidentType>('Incident', IncidentSchema);
