import { User, UserDoc, UserModel } from "../model/user.model";

export class UserService {
    private userModel: UserModel;

    constructor() {
        // Initialize the User model for use in this service
        this.userModel = User;
    }

    // Create a new user with the provided data
    async createUser(data: Partial<UserDoc>): Promise<UserDoc> {
        // Create and return a new user document
        const user = await this.userModel.create({
            ...data
        });
        return user;
    };

    // Find a user by their email address
    async findOneUserEmail(email: string): Promise<UserDoc | null> {
        // Convert email to lowercase and find user
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }

    // Find a user by their ID
    async findOneUser(id: string): Promise<UserDoc | null> {
        // Find user by ID and exclude the password field from the result
        const user = await this.userModel.findById(id).select('-password').exec();
        return user;
    }

    // Find a user by their verification code
    async findUserUsingCode(code: string) {
        // Find user by verification code and exclude the password field
        return this.userModel.findOne({ verification_code: code }).select('-password').exec();
    }

    // Find a user by their password reset code
    async findResetCode(code: string) {
        // Find user by reset password code and exclude the password field
        return this.userModel.findOne({ resetPasswordCode: code }).select('-password').exec();
    }

    // Retrieve all users
    async findAllUser(): Promise<UserDoc[]> {
        // Find all users and exclude the password field from the results
        const users = await this.userModel.find().select('-password').exec();
        return users;
    }

    // Update a user's data by their ID
    async updateUser(id: string, data: Partial<UserDoc>): Promise<UserDoc | null> {
        // Find user by ID and update with new data, returning the updated user
        const user = await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
        return user;
    }

    // Delete a user by their ID
    async deleteUser(id: string): Promise<boolean> {
        // Delete the user by ID and return a boolean indicating success
        const user = await this.userModel.deleteOne({ _id: id }).exec();
        return user.deletedCount > 0;
    }
}
