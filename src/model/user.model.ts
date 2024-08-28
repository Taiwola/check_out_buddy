import mongoose from "mongoose";


export interface UserDoc extends mongoose.Document {
    name: string,
    email: string,
    image: string,
    password: string,
    role: string,
    location: string,
    phoneNo: string,
    googleUserId: string,
    refreshToken: string,
    verified: boolean,
    verification_code: string,
    verification_code_expires: Date,
    resetPasswordCode: string,
    resetPasswordCodeExpiresIn: Date,
    createdAt: Date,
    updatedAt: Date
}


export interface UserModel extends mongoose.Model<UserDoc> {}


const userSchema = new mongoose.Schema<UserDoc>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String , required:false},
    password: { type: String, required: false },
    role: { type: String, required: false, default: "user" },
    location: {type: String, required: false},
    phoneNo: {type: String, required: false},
    googleUserId:{type: String, required: false},
    refreshToken: {type: String, required: true},
    verified: {type: Boolean, required: true, default: false},
    verification_code: {type: String, unique: true, required: true},
    verification_code_expires: { type: Date, required: true }, 
    resetPasswordCode: {type: String, required: false},
    resetPasswordCodeExpiresIn: {type: Date, required: false}
}, {
    timestamps: true
});


export const User = mongoose.model<UserDoc, UserModel>('user', userSchema);