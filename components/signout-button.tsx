"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import LoadingButton from "@/components/loading-button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
export default function SignoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    try {
      setPending(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/sign-in");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <LoadingButton
      className={cn(
        buttonVariants({ variant: "outline" }),
        "text-black-primary font-sans font-semibold text-md flex-row border-none mx-2/3",
        "md:border-2 md:border-solid md:border-black-primary/20 md:gap-4 md:px-8 py-5",
        "hover:border-black-primary/30",
      )}
      pending={pending}
      onClick={handleSignOut}
    >
      Sign Out
    </LoadingButton>
  );
}
