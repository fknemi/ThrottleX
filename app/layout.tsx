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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
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
