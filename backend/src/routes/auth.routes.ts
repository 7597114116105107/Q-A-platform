import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { ensureFreeSubscription } from "../services/subscription.service.js";
import { getTodayRangeInIst } from "../utils/dates.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^[0-9]{10,15}$/)
    .optional()
    .or(z.literal("")),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(3),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone?.trim() ? body.phone.trim() : null,
        passwordHash,
      },
    });

    await ensureFreeSubscription(user.id);

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password", 401);
    }

    await ensureFreeSubscription(user.id);

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { identifier } = forgotPasswordSchema.parse(req.body);
    const value = identifier.trim();
    const isEmail = value.includes("@");
    const lookup = isEmail ? value.toLowerCase() : value;

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: lookup } : { phone: lookup },
    });

    if (!user) {
      throw new AppError("No user found with this email or phone number", 404);
    }

    const { start, end } = getTodayRangeInIst();
    const alreadyUsedToday =
      !!user.forgotPasswordRequestedAt &&
      user.forgotPasswordRequestedAt >= start &&
      user.forgotPasswordRequestedAt <= end;

    if (alreadyUsedToday) {
      throw new AppError(
        "You can use this option only one time per day.",
        429,
        "FORGOT_PASSWORD_LIMIT"
      );
    }

    const generatedPassword = generateAlphabeticPassword(12);
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        forgotPasswordRequestedAt: new Date(),
      },
    });

    res.json({
      message: "Password reset successful. Use the generated password to login.",
      generatedPassword,
    });
  } catch (error) {
    next(error);
  }
});

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfigured", 500);
  }
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

function generateAlphabeticPassword(length = 12): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    password += alphabet[index];
  }
  return password;
}

export default router;
