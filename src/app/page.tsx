import { auth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header user={session.user} />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome to MarketWhisper
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Your Market Intelligence Hub
          </p>
          
          <div className="mt-8 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              Session Information
            </h2>
            <div className="text-left space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p><span className="font-medium">User:</span> {session.user.name}</p>
              <p><span className="font-medium">Email:</span> {session.user.email}</p>
              <p><span className="font-medium">ID:</span> {session.user.id}</p>
            </div>
          </div>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-8">
            Click the Logout button in the header to test the authentication flow
          </p>
        </div>
      </main>
    </div>
  );
}
