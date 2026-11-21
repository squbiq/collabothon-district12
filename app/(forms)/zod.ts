import z from "zod";

const username = z.string()
  .min(6, "Username must be at least 6 characters.")
  .max(20, "Username can be at most 20 characters.")
  .regex(/^[a-zA-Z0-9_.]+$/,
    "Only letters, numbers, periods, and underscores are allowed."
  );

const email = z.email("Please enter a valid email address.");

const password = z.string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password can be at most 128 characters.");

export const registerSchema = z.object({
  username: username,
  email: email,
  password: password,
});

export const loginSchema = z.object({
  email: email,
  password: password,
});