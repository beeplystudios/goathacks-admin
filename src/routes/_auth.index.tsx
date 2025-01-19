import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../utils/mall";

export const Route = createFileRoute("/_auth/")({
  component: RouteComponent,
});

function RouteComponent() {
  const logOut = useAuthStore((s) => s.logOut);
  const router = useRouter();

  return (
    <div className="bg-red-500">
      Hello "/"!
      <Button
        onPress={() => {
          logOut();

          router.invalidate();
        }}
      >
        Log Out
      </Button>
    </div>
  );
}
