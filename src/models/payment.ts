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
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    content: {
        type: String,
        required: [true, 'Payment content is required']
    },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'completed', 'failed'], 
        default: 'pending' 
    },
    method: {
        type: String,
        enum: ['bank_transfer', 'e_wallet', 'cash'],
        default: 'bank_transfer'
    },
    txnId: String,
    gatewayTransactionId: String,
    paidAt: Date
}, {
    timestamps: true
});

export type PaymentType = InferSchemaType<typeof PaymentSchema> & Document;

export const PaymentModel = mongoose.models.Payment || mongoose.model<PaymentType>('Payment', PaymentSchema);