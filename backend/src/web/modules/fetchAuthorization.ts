import { Request, Response } from 'express';

export default async function fetchAuthorization(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header is missing" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Token is missing" });
        }



        // Here you would typically verify the token and extract user information
        // For example:
        // const user = await verifyToken(token);
        // req.user = user;
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An unexpected error occurred" });
    }
}