import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const PayoutSchema = new Schema({
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account',
        required: [true, 'Owner ID is required']
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking', 
        required: [true, 'Booking ID is required']
    },
    incidentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Incident'
    },
    images: [String],
    notes: { 
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

export type PayoutType = InferSchemaType<typeof PayoutSchema> & Document;

export const PayoutModel = mongoose.models.Payout || mongoose.model<PayoutType>('Payout', PayoutSchema);
