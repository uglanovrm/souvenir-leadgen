import { hasSupabaseEnv } from "../../lib/env";
import { signInAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const ready = hasSupabaseEnv();
  const next = params.next ?? "/app";

  return (
    <main className="main">
      <div className="page-header">
        <div>
          <p className="eyebrow">Auth</p>
          <h1>Sign in</h1>
        </div>
        {!ready ? <div className="status">Supabase env is missing. Auth is disabled.</div> : null}
      </div>
      <form action={signInAction} className="card stack" style={{ maxWidth: 480 }}>
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required disabled={!ready} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required disabled={!ready} />
        </div>
        {params.error ? <div className="status">{params.error}</div> : null}
        <button className="button" type="submit" disabled={!ready}>
          Sign in
        </button>
      </form>
    </main>
  );
}
