import { Context, Next } from "hono";

export const requireAuth = async (c: Context, next: Next) => {
  const auth = c.req.header("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized - Bearer token required" }, 401);
  }

  return next();
};
