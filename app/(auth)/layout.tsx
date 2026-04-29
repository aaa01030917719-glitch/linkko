import GuestOnlyShell from "@/components/auth/GuestOnlyShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestOnlyShell>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-5">
        {children}
      </main>
    </GuestOnlyShell>
  );
}
