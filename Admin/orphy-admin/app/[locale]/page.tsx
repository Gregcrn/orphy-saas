"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("common.appName")}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {t("common.tagline")}
        </p>

        {/* Auth buttons */}
        <SignedOut>
          <div className="flex gap-4">
            <Link
              href="/sign-in"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t("auth.signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              {t("auth.signUp")}
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-6">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-16 h-16",
                },
              }}
            />
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("auth.welcome")}
            </p>
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {t("dashboard.goToDashboard")}
            </Link>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
