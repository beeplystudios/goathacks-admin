import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (!context.auth.credentials) {
      throw redirect({ to: "/login" });
    } else {
      // get the data we need
    }
  },
});
