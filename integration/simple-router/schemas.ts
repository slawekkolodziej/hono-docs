import { z } from "zod";
import * as v from "valibot";

export const VALID_USER_IDS = ["1", "2", "3", "42"];

export const users = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
  { id: "3", name: "Charlie", email: "charlie@example.com" },
];

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const CreateUserSchemaV = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  email: v.pipe(v.string(), v.email("Invalid email format")),
});
