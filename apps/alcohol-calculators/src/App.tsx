import { useEffect, useState } from "react";
import AppDashboard from "./components/AppDashboard";
import StandardDrinkCalculator from "./components/StandardDrinkCalculator";
import BALTrajectoryCalculator from "./components/BALTrajectoryCalculator";

export type ToolRoute = "dashboard" | "standard-drinks" | "bal-trajectory";

function routeFromHash(): ToolRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "standard-drinks" || hash === "bal-trajectory") {
    return hash;
  }

  return "dashboard";
}

export default function App() {
  const [route, setRoute] = useState<ToolRoute>(routeFromHash);

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(nextRoute: ToolRoute) {
    window.location.hash = nextRoute === "dashboard" ? "" : `/${nextRoute}`;
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      {route === "dashboard" && <AppDashboard onSelect={navigate} />}
      {route === "standard-drinks" && (
        <StandardDrinkCalculator onBack={() => navigate("dashboard")} />
      )}
      {route === "bal-trajectory" && (
        <BALTrajectoryCalculator onBack={() => navigate("dashboard")} />
      )}
    </div>
  );
}
