// This page must be a Client Component to use state/effects,
// but keep the content mostly static for speed.
"use client";

import { Plane } from "lucide-react"; // Assuming you have lucide-react (common with Shadcn UI)
import { Button } from "~/components/ui/button"; // Assuming Shadcn UI button

export default function OfflinePage() {
  const handleReload = () => {
    // Attempt to refresh the page to reconnect
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center dark:bg-gray-900">
      <Plane className="mb-6 h-16 w-16 text-red-500" />
      <h1 className="mb-3 text-3xl font-bold dark:text-white">
        You are Offline
      </h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        It looks like your connection has been interrupted. Please check your
        network settings.
      </p>

      <Button
        onClick={handleReload}
        variant="default" // Assuming a default button style
      >
        Try Reloading
      </Button>

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
        Some parts of this application may be available without connection.
      </p>
    </div>
  );
}
