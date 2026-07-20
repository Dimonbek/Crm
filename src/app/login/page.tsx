import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-fg">
            D
          </div>
          <h1 className="text-2xl font-semibold">DimoCRM</h1>
          <p className="mt-1 text-sm text-muted">Hisobingizga kiring</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Biznesingizni ulang
          </Link>
        </p>
      </div>
    </main>
  );
}
