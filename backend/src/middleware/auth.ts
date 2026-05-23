import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

export type AuthRequest = Request & { userId: string };

type TokenPayload = { userId: string };

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("Server misconfigured", 500);
    }

    const payload = jwt.verify(token, secret) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      throw new AppError("User not found", 401, "UNAUTHORIZED");
    }

    (req as AuthRequest).userId = user.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}
