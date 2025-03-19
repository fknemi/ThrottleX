"use client";
import Link from "next/link";
import AuthButtons from "@/components/auth-buttons";
import { Session } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data, isPending } = authClient.useSession();
  if (isPending) return <div>Loading...</div>;

  const session = data as Session;

  return (
    <nav className="flex justify-between items-center py-3 px-4 fixed top-0 left-0 right-0 z-50 bg-slate-100">
      <Link href="/" className="text-xl font-bold">
        better-auth
      </Link>
      <AuthButtons session={session} />
    </nav>
  );
}
