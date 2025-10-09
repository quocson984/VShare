import { Schema } from "mongoose";

const LocationSchema = new Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
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

export { LocationSchema };