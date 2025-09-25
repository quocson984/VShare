import mongoose, { Document, Schema, InferSchemaType } from 'mongoose';

const ReviewSchema = new Schema({
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
        ref: 'Account',
        required: [true, 'Owner ID is required']
    },
    rating: { 
        type: Number, 
        required: [true, 'Rating is required'], 
        min: [1, 'Rating must be at least 1'], 
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

export type ReviewType = InferSchemaType<typeof ReviewSchema> & Document;

export const ReviewModel = mongoose.models.Review || mongoose.model<ReviewType>('Review', ReviewSchema);
