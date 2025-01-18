import React, { useState } from "react";
import { Input } from "./ui/input";
import { TextField } from "react-aria-components";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useAuthStore } from "../utils/mall";
import { useNavigate } from "@tanstack/react-router";

export const LoginForm: React.FC = () => {
  const logIn = useAuthStore((s) => s.logIn);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const formData = new FormData(evt.currentTarget);

    const username = formData.get("username")?.toString();
    const password = formData.get("password")!;

    // pretend to log in with this
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);

    logIn({ username, token: crypto.randomUUID() });

    navigate({ to: "/" });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-1/4">
      <TextField name="username" className="w-full">
        <Label>Username</Label>
        <Input fullWidth />
      </TextField>
      <TextField name="password">
        <Label>Password</Label>
        <Input type="password" fullWidth />
      </TextField>
      <Button variant="primary" type="submit" isLoading={isLoading} fullWidth>
        Sign In
      </Button>
    </form>
  );
};
