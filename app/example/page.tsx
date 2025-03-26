"use client";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import Image from "next/image";
import { Session } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import RazorpayPayment from "@/components/RazorpayPayment";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
export default function Example() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  if (isPending) return <div>Loading...</div>;

  const session = data as Session;

  // const { isPending, error, data } = useQuery({
  //     queryKey: ["repoData"],
  //     queryFn: () => fetch("/api/auth/get-session").then((res) => res.json()),
  // });
  // if (isPending) return "Loading...";
  if (!session) return "Loading...";

  // if (error) return "An error has occurred: " + error.message;
  return (
    <div>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        The People of the Kingdom
      </h2>

      <Card>
        <CardDescription>{JSON.stringify(data)}</CardDescription>
        <CardContent>
          <AspectRatio ratio={16 / 9}>
            <Image
              src="https://picsum.photos/800/400"
              alt="Image"
              className="rounded-md object-cover"
              width={800}
              height={400}
            />
          </AspectRatio>
        </CardContent>
      </Card>

      <RazorpayPayment
        amount={100}
        name={session.user.name}
        email={session.user.email}
        contact={session.user.email}
        onSuccessAction={() => {
          router.push("/");
        }}
      />
    </div>
  );
}
