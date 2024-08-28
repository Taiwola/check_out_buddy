import { StringSchema } from 'joi';
import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for ScannedHistory
export interface IScannedHistory extends Document {
    userId: mongoose.Types.ObjectId | String;
    barcode: string;
    name: string;
    price: string;
    category: string;
    imageUrl: string;
    imagesUrl: []
    height: string,
    weight: string,
    depth: string,
    color: string,
    volume: string,
    width: string,
    createdAt: Date,
    updatedAt: Date
}

// Define the ScannedHistory Schema
const ScannedHistorySchema: Schema = new Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'user', required: true },
    barcode: { type: String, required: true },
    name: { type: String, required: true },
    price: {type: String, required: true},
    category: {type: String, required: true},
    imageUrl: {type: String, required: true},
    weight: {type: String, required: false},
    width: {type: String, requird: false},
    height: {type: String, required: false},
    depth: {type: String, required: false},
    color: {type: String, required: false},
    volume: {type: String, required: false},
    imagesUrl: [{type: String, required: false}],
}, {
    timestamps: true
});

// Create and export the ScannedHistory model
export const ScannedHistory = mongoose.model<IScannedHistory>('ScannedHistory', ScannedHistorySchema);
