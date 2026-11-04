import { signIn, type OAuthProvider } from "../actions";

const PROVIDERS: { id: OAuthProvider; label: string; className: string }[] = [
  { id: "google", label: "Google로 계속하기", className: "bg-white text-zinc-900 border border-zinc-300" },
  { id: "apple", label: "Apple로 계속하기", className: "bg-black text-white" },
];

export function SignInButtons({ next }: { next: string | null }) {
  return (
    <div className="flex w-full flex-col gap-3">
      {PROVIDERS.map((p) => (
        <form key={p.id} action={signIn.bind(null, p.id, next)}>
          <button type="submit" className={`w-full rounded-xl px-4 py-3 font-medium ${p.className}`}>
            {p.label}
          </button>
        </form>
      ))}
    </div>
  );
}
