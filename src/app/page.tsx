import { SignInButton, UserButton } from "@clerk/nextjs";
// ✅ FIX: Import auth from the server submodule
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  LogIn,
  LayoutDashboard,
  Mic,
  ListChecks,
  FileDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"; // Import Card components

// This is a Server Component, optimized for initial load speed.
export default async function LandingPage() {
  // Check authentication status on the server
  const { userId } = await auth();

  const isAuthenticated = !!userId;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      {/* 🎯 Navigation Bar */}
      <header className="top-0 z-10 w-full border-transparent bg-transparent md:sticky md:border-b md:border-gray-200 md:bg-white md:shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-bold text-blue-700"
          >
            🩺 Hastory
          </Link>

          {/* 🎯 Dynamic Auth Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              // Logged In State
              <>
                <Button asChild variant="secondary" className="hidden sm:flex">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <div className="h-8 w-8">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              // Logged Out State
              <SignInButton mode="modal">
                <Button>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* 🎯 Hero Section */}
      <main className="flex flex-grow items-center justify-center p-4 pt-15">
        <div className="w-full max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Structured Medical Documentation, Powered by AI.
          </h1>
          <p className="mb-8 text-lg text-gray-600 sm:text-xl">
            Convert doctor-patient conversation transcripts and audio recordings
            into clean, secure, and structured patient history reports, saving
            hours on manual charting.
          </p>

          <div className="flex justify-center space-x-4">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Analysis (Free)
                </Button>
              </SignInButton>
            )}

            {/* Simple explanatory button/link */}
            <Button asChild variant="outline" size="lg">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </main>

      {/* 🎯 Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-800">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <Card className="shadow-lg transition duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Mic className="mr-3 h-5 w-5 text-red-500" />
                  Record or Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                Input conversation transcripts directly, or use your
                device&apos;s microphone to record the session live.
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-lg transition duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <ListChecks className="mr-3 h-5 w-5 text-yellow-600" />
                  AI Analysis & Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                Our models extract the Chief Complaint, HPI, Medications, and
                Assessment, formatting them into a standard clinical JSON
                structure.
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-lg transition duration-300 hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileDown className="mr-3 h-5 w-5 text-green-600" />
                  Save & Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                Save the structured report directly to the patient&apos;s record
                in your database. Export reports as PDF instantly.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} MedDoc AI. All rights reserved.
      </footer>
    </div>
  );
}
