"use client";

import { useEffect } from "react";
import WelcomeToast from "../components/WelcomeToast";
import GlobalTaskButton from "../components/GlobalTaskButton";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <div className="antialiased">
      {children}
      <WelcomeToast />
      <GlobalTaskButton />
    </div>
  );
}
