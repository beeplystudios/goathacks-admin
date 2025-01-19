import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "../components/LoginForm";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center flex-col h-screen gap-8">
      <div className="w-1/4">
        <h1 className="text-xl font-semibold">
          Welcome to{" "}
          <span className="text-pastel-fuchsia-primary">hustleandbustle</span>
        </h1>
        <p className="text-sm text-neutral-50">
          Please Sign In Below! If you do not have credentials, please contact
          us{" "}
          <a
            href="mailto:beeplystudios@gmail.com"
            className="text-pastel-teal-primary underline"
          >
            here
          </a>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
