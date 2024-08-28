import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services";

// Interface for the decoded JWT payload
interface Decoded {
    id: string;
    email: string;
}

const userService = new UserService();

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Token not provided" });
        }

        const token = authHeader.split(' ')[1];

        // Handle guest access
        if (token === "guest") {
            req.user = {
                id: "",
                email: "",
                role: "guest",
            };
            return next();
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as Decoded;

        if (!decoded) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const user = await userService.findOneUser(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Token not authorized' });
        }

        // Set the user in the request object
        req.user = {
            id: user._id as string,
            email: user.email,
            role: user.role
        };

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token or server error' });
    }
};

