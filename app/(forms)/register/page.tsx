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
import logo from "@/public/logo-all.svg"
import Image from "next/image";
import { Lock, Mail, User } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { registerSchema } from "../zod";
 
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
      toast.add({
        type: "error",
        title: "Something went wrong",
        description: error.message ?? "Account creation failed.",
      });
      return;
    }

    toast.add({
      type: "success",
      title: "Account successfully created"
    });
 
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
          <form id="form-register" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-register-username"><User />Username</FieldLabel>
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
                    <FieldLabel htmlFor="form-register-email"><Mail />E-mail</FieldLabel>
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
                    <FieldLabel htmlFor="form-register-password"><Lock />Password</FieldLabel>
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
 
