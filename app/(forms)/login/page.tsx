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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import logo from "@/public/logo-all.svg"
import { Lock, Mail } from "lucide-react";
import { loginSchema } from "../zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
        console.error("Login error:", error);
      form.setError("root", {
        message: "Invalid email or password.",
      });
      return;
    }

    router.push("/");
    router.refresh();
  }

  const rootError = form.formState.errors.root;

  return (
    <div className="w-auto h-auto flex flex-col items-center justify-center p-6">
      <section className="h-26 pb-6">
        <Image src={logo} alt="page-logo" className="h-full" />
      </section>
      <Card className="w-full sm:max-w-md">
        <CardHeader className="flex flex-col gap-2 justify-center items-center py-2">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription className="text-center">
            Enter your username, email, and password to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-login-email"><Mail />E-mail</FieldLabel>
                    <Input
                      {...field}
                      id="form-login-email"
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
                    <FieldLabel htmlFor="form-login-password"><Lock />Password</FieldLabel>
                    <Input
                      {...field}
                      id="form-login-password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password"
                    />
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
            form="form-login"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Logging in..." : "Login"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}