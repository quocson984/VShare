import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const BookingSchema = new Schema({
    equipmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Equipment',
        required: [true, 'Equipment ID is required']
    },
    renterId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account',
        required: [true, 'Renter ID is required']
    },
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account',
        required: [true, 'Owner ID is required']
    },
    startDate: { 
        type: Date, 
        required: [true, 'Start date is required']
    },
    endDate: { 
        type: Date, 
        required: [true, 'End date is required']
    },
    checkinImages: [String],
    checkinTime: Date,
    checkoutImages: [String],
    checkoutTime: Date,
    insuranceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Insurance'
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Base price cannot be negative']
    },
    serviceFee: { 
        type: Number, 
        default: 0,
        min: [0, 'Service fee cannot be negative']
    },
    insuranceFee: { 
        type: Number, 
        default: 0,
        min: [0, 'Insurance fee cannot be negative']
    },
    discount: { 
        type: Number, 
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    totalPrice: { 
        type: Number, 
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'canceled', 'completed'], 
        default: 'pending' 
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'partially_paid', 'refunded'],
        default: 'pending'
    },
    notes: String
}, {
    timestamps: true
});

export type BookingType = InferSchemaType<typeof BookingSchema> & Document;

export const BookingModel = mongoose.models.Booking || mongoose.model<BookingType>('Booking', BookingSchema);