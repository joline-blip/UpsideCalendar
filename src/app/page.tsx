export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="text-sm text-muted-foreground">UpsideCalendar</div>
          <div className="text-2xl font-semibold tracking-tight">Scheduling, availability, and bookings</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <a href="/login" className="rounded-xl border p-6 hover:bg-muted/40 transition-colors">
            <div className="font-medium">BA sign in</div>
            <div className="mt-1 text-sm text-muted-foreground">Email + password</div>
          </a>
          <a href="/signup" className="rounded-xl border p-6 hover:bg-muted/40 transition-colors">
            <div className="font-medium">BA sign up</div>
            <div className="mt-1 text-sm text-muted-foreground">Create an account</div>
          </a>
          <a
            href="/staff/availability"
            className="rounded-xl border p-6 hover:bg-muted/40 transition-colors"
          >
            <div className="font-medium">Availability</div>
            <div className="mt-1 text-sm text-muted-foreground">Set your available times</div>
          </a>
          <a href="/admin/login" className="rounded-xl border p-6 hover:bg-muted/40 transition-colors">
            <div className="font-medium">Admin</div>
            <div className="mt-1 text-sm text-muted-foreground">Admin sign in</div>
          </a>
        </div>

        <div className="mt-10 rounded-xl border p-6">
          <div className="font-medium">Public booking (example)</div>
          <div className="mt-1 text-sm text-muted-foreground">
            After you create an event type in Admin, the public URL is{" "}
            <code className="px-1">/book/&lt;slug&gt;</code>.
          </div>
        </div>
      </main>
    </div>
  );
}
