import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import Navbar from "@/components/navbar";
import { QueryProvider } from "@/components/QueryProvider"; // Import the client wrapper

export const metadata: Metadata = {
  title: "NextJS Typescript Template",
  description:
    "NextJS + RazorPay + Prisma + BetterAuth + TanStackQuery + shadcn + TailwindCSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <QueryProvider>
          <Navbar />
          <div className="mt-20">{children}</div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
