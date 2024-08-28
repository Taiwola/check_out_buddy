import { UserDoc } from "../model/user.model";
import {UserService} from "../services"
import {Request, Response} from "express";


// UserController manages user-related operations
export class UserController {
    private userService: UserService;
    constructor() {
        this.userService = new UserService();
    }

     // Method to transform a single user's data by removing sensitive fields
    private async transformUserData (user: UserDoc) {
        const {
            password,
            _id,
            __v,
            verification_code,
            verification_code_expires,
            refreshToken,
            resetPasswordCode,
            resetPasswordCodeExpiresIn,
            role,
            googleUserId,
            ...rest
          } = user.toObject();
          return {
            user: { id: _id, image: user.image || "", ...rest },
            refreshToken: user.refreshToken,
          };
    }

     // Method to transform an array of users' data by removing sensitive fields
    private async transformUsersData(users:UserDoc[]) {
        const transformUser = users.map((user) => {
            const {
                 __v,
                 _id,
                 verification_code,
                 verification_code_expires,
                 refreshToken,
                 resetPasswordCode,
                 resetPasswordCodeExpiresIn,
                 role,
                 googleUserId,
                  ...rest} = user.toObject();
            return {
                id: user._id,
                ...rest
            }
        });

        return transformUser;
    }


     // Method to update a user's details
    async updateUser(req: Request, res: Response) {
        const { name, email, phoneNo, location }: UserDoc = req.body; // Extract user details from request body
        const usr = req.user; // Get authenticated user from request

        // Check if the user is a guest
        if (usr && usr.role === 'guest') {
            return res.status(200).json({message: "Request was successfull", data: {}, success: true});
        }
    
        try {
            const userId = req.params.id; // Get user ID from request parameters
            const user = await this.userService.findOneUser(userId);
    
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
    
            // Update user details
            user.name = name || user.name;
            user.email = email || user.email;
            user.phoneNo = phoneNo || user.phoneNo;
            user.location = location || user.location;
    
            // Save the updated user
            const updatedUser = await user.save();
            const transformUser = await this.transformUserData(updatedUser);
    
            // Respond with the updated user data
            res.status(200).json({
                message: "Request was successfull",
                data: transformUser,
                success: true
            });
        } catch (error) {
            // Handle any errors
            console.log(error);
            res.status(500).json({
                data: {message: "An error occurred while updating the user"},
                status: 500
            });
        }
    }

      // Method to retrieve a single user by ID
    async getOneUser(req: Request, res: Response) {
        try {
            const userId = req.params.id; // Get user ID from request parameters
            const user = await this.userService.findOneUser(userId);
            const userReq = req.user; // Get authenticated user from request

            // Check if the user is a guest
            if (userReq && userReq.role === 'guest') {
                return res.status(200).json({message: "Request was successfull", data: {}, success: true});
            }

            if (!user) {
                return res.status(404).json({ data: {message: "User not found"}, status: 404});
            }
            const transformUser = await this.transformUserData(user); // Transform user data

            res.status(200).json({ message: "Request was successfull", data: transformUser, success: true });
        } catch (error) {
             // Handle any errors and log them
            console.log(error);
            res.status(500).json({ data: {message: "An error occurred"}, status: 500 });
        }
    }
    
      // Method to retrieve all users
    async getAllUsers(req: Request, res: Response) {
            const user = req.user // Get authenticated user from request
   
            let users:UserDoc[] = []  // Initialize an empty array for users

            // Check if the user is a guest
            if (user && user.role === 'guest') {
                return res.status(200).json({ message:"Request was successfull" ,data: users, success: true });
            }
            users = await this.userService.findAllUser(); // Retrieve all users
            users = await this.transformUsersData(users); // Transform users' data
            return res.status(200).json({ message:"Request was successfull" ,data: users, success: true });
    }

     // Method to delete a user by ID
    async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id; // Get user ID from request parameters
            const isDeleted = await this.userService.deleteUser(userId);  // Attempt to delete the user

            if (!isDeleted) {
                return res.status(404).json({ data: {message: "User not found"}, status:404 });
            }

            res.status(200).json({ message: "User deleted successfully", success: true });
        } catch (error) {
            console.log(error);
            res.status(500).json({ data: {message: "An error occurred"}, status:500 });
        }
    }
}