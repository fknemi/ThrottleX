"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import SignoutButton from "@/components/signout-button";
import { Button } from "@/components/ui/button";
import {prisma} from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Dot } from "lucide-react";
import { Session } from "@/lib/auth";
export default function AuthButtons({
  session,
  className,
}: {
  session: Session;
  className: string;
}) {
  return (
    <div className={className}>
      {!session ? (
        <div className="flex flex-row items-end md:items-center justify-between md:justify-center">
          <Link
            href="/sign-in"
            className={cn(
              "text-black-primary font-sans font-semibold text-md flex flex-row items-center justify-center hover:border-black-primary/30",
              "md:px-8 md:py-5",
            )}
          >
            <span className="ml-[-2px]">Login</span>{" "}
            <Dot size={32} strokeWidth={1.5} />
          </Link>

          <Link href="/sign-up" className="">
            <Button
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-black-primary font-sans font-semibold text-md flex-row border-none",
                "md:border-2 md:border-solid md:border-black-primary/20 md:gap-4 md:px-8 py-5",
                "hover:border-black-primary/30",
              )}
            >
              <span>Sign Up</span>{" "}
              <ArrowRight className="md:!w-[24px] md:!h-[24px] md:stroke-3 stroke-2 !w-[20px] !h-[20px]" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-end justify-end">
          <SignoutButton />
        </div>
      )}
    </div>
  );
}
