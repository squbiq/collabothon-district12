"use client";
 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
 
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
 
const registerSchema = z.object({
  username: z
    .string()
    .min(6, "Username must be at least 6 characters.")
    .max(20, "Username can be at most 20 characters.")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "Only letters, numbers, periods, and underscores are allowed."
    ),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password can be at most 128 characters."),
});
 
type RegisterValues = z.infer<typeof registerSchema>;
 
export default function RegisterPage() {
  const router = useRouter();
 
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" }, 
  });
 
  async function onSubmit(values: RegisterValues) {
    const { error } = await authClient.signUp.email({
      username: values.username,
      email: values.email,
      password: values.password,
      name: values.username,
      displayUsername: values.username,
    });
 
    if (error) {
      form.setError("root", {
        message: error.message ?? "Account creation failed.",
      });
      return;
    }
 
    router.push("/");
    router.refresh();
  }
 
  const rootError = form.formState.errors.root;
 
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Enter your username, email, and password to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-register" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-register-username">
                      Username
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-register-username"
                      aria-invalid={fieldState.invalid}
                      autoComplete="username"
                    />
                    <FieldDescription>
                      6–20 characters: letters, numbers, periods, and underscores.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-register-email">E-mail</FieldLabel>
                    <Input
                      {...field}
                      id="form-register-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-register-password">
                      Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-register-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="new-password"
                    />
                    <FieldDescription>At least 8 characters.</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {rootError && <FieldError errors={[rootError]} />}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            form="form-register"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Creating account..."
              : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
 
