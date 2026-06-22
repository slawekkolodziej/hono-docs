import { z } from "zod";

export const mockUsers = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

export const VALID_DOC_IDS = ["api-guide", "getting-started", "authentication"];

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
});
