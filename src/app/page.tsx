import {
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">FlashyCardy</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            My personal flash cards
          </p>
        </div>
        <Show when="signed-out">
          <div className="flex gap-4">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button size="lg">Sign Up</Button>
            </SignUpButton>
          </div>
        </Show>
      </div>
    </div>
  );
}
