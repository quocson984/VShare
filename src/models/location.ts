import { Schema } from "mongoose";

const LocationSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: '2dsphere' // Add geospatial index for proximity search
    },
    address: {
        type: String,
        required: true
    },
    district: String,
    city: String,
    country: {
        type: String,
        default: 'Vietnam'
    }
}, { _id: false });

// Ensure geospatial index is created
LocationSchema.index({ coordinates: '2dsphere' });

export { LocationSchema };