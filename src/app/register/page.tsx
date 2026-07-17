import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-fg">
            R
          </div>
          <h1 className="text-2xl font-semibold">Biznesingizni ulang</h1>
          <p className="mt-1 text-sm text-muted">
            Bepul boshlang — karta kerak emas
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/20">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </main>
  );
}
