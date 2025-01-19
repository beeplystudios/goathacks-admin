import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthState } from "../utils/mall";
import { APIProvider } from "@vis.gl/react-google-maps";

export const Route = createRootRouteWithContext<{
  auth: AuthState;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_API_KEY}>
        <Outlet />
      </APIProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
