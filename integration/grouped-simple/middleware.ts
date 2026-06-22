import { Context, Next } from "hono";

export const occasionallyFails = async (c: Context, next: Next) => {
  if (Math.random() > 0.99) {
    return c.json({ error: true }, 500);
  }

  return next();
};
