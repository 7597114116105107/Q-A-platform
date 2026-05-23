import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { checkQuestionPostingAllowed } from "../services/questionLimit.service.js";

const router = Router();

const createQuestionSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(10).max(5000),
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId;
    const questions = await prisma.question.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
      },
    });
    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId;
    const body = createQuestionSchema.parse(req.body);

    const usage = await checkQuestionPostingAllowed(userId);

    const question = await prisma.question.create({
      data: {
        userId,
        title: body.title,
        body: body.body,
      },
    });

    res.status(201).json({
      question,
      usage: {
        usedToday: usage.usedToday + 1,
        limit: usage.limit,
        remaining:
          usage.remaining === null ? null : Math.max(0, usage.remaining - 1),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
