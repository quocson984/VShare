import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const PaymentSchema = new Schema({
    ref: String,
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking',
        required: [true, 'Booking ID is required']
    },
    renterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account',
        required: [true, 'Renter ID is required']
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
    gatewayTransactionId: String
}, {
    timestamps: true
});

export type PaymentType = InferSchemaType<typeof PaymentSchema> & Document;

export const PaymentModel = mongoose.models.Payment || mongoose.model<PaymentType>('Payment', PaymentSchema);