import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, fetchInquiries, login, logout, type Inquiry } from "../lib/api";
import { TYPE_LABEL } from "../lib/validate";

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Yönetim — Aylin Gedik";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = "Aylin Gedik — Yazılım Geliştirme";
      meta?.setAttribute("content", "index, follow");
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchInquiries()
      .then((inquiries) => {
        if (!active) return;
        setItems(inquiries);
        setAuthed(true);
      })
      .catch(() => {
        if (active) setAuthed(false);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await login(password);
      setItems(await fetchInquiries());
      setPassword("");
      setAuthed(true);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Giriş yapılamadı.");
    } finally {
      setPending(false);
    }
  }

  async function onLogout() {
    try {
      await logout();
    } catch {
      setMessage("Çıkış tamamlanamadı. Sayfayı yenileyin.");
    }
    setAuthed(false);
    setItems([]);
  }

  async function reload() {
    try {
      setItems(await fetchInquiries());
      setMessage("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setAuthed(false);
      setMessage(error instanceof ApiError ? error.message : "Liste alınamadı.");
    }
  }

  return (
    <main className="admin wrap">
      <p className="eyebrow">Özel alan</p>
      <div className="admin-head">
        <h1>Gelen talepler</h1>
        <Link to="/">Siteye dön</Link>
      </div>
      {!ready ? (
        <p>Yükleniyor…</p>
      ) : !authed ? (
        <form className="login" onSubmit={onLogin}>
          <label htmlFor="admin-password">
            Yönetim şifresi
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="button solid" type="submit" disabled={pending}>
            {pending ? "Kontrol ediliyor…" : "Giriş yap"}
          </button>
          {message && (
            <p className="notice bad" role="alert">
              {message}
            </p>
          )}
        </form>
      ) : (
        <>
          <div className="admin-tools">
            <p>{items.length} talep</p>
            <button type="button" onClick={reload}>
              Yenile
            </button>
            <button type="button" onClick={onLogout}>
              Çıkış
            </button>
          </div>
          {message && <p className="notice bad">{message}</p>}
          {items.length === 0 ? (
            <p>Henüz talep yok.</p>
          ) : (
            <div className="inquiry-list">
              {items.map((item) => (
                <article key={item.id}>
                  <header>
                    <strong>{item.name}</strong>
                    <span>{formatDate(item.createdAt)}</span>
                  </header>
                  <p className="gmail">
                    {/^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(item.email) ? (
                      <a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a>
                    ) : (
                      item.email
                    )}
                  </p>
                  <p>
                    {TYPE_LABEL[item.projectType]} · {item.projectName}
                  </p>
                  <p className="pre">{item.description}</p>
                  <p className="pre">{item.features}</p>
                  {item.budget && <p>Bütçe: {item.budget}</p>}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
