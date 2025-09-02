/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context, Next } from "hono";

export const createTypedMiddleware = <T = any>(
  fn: (c: Context, next: Next) => Promise<T | void>
) => fn;
