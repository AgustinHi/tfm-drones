import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { useTranslation } from "react-i18next";

export default function Home() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);

  const [drones, setDrones] = useState([]);
  const [query, setQuery] = useState("");

  // Importante: si NO estás logueado, Home no llama al backend (evita 401 + redirect)
  const [infoMsg, setInfoMsg] = useState(
    loggedIn
      ? ""
      : t("home.info.loginToSeeList", {
          defaultValue: L("Inicia sesión para ver el listado de drones.", "Sign in to see your drone list."),
        })
  );
  const [loading, setLoading] = useState(false);

  const logout = () => {
    clearToken();
    navigate("/");
  };

  useEffect(() => {
    let alive = true;

    // Home pública: si no hay sesión, no pedimos /drones
    if (!loggedIn) {
      setDrones([]);
      setLoading(false);
      setInfoMsg(
        t("home.info.loginToSeeList", {
          defaultValue: L("Inicia sesión para ver el listado de drones.", "Sign in to see your drone list."),
        })
      );
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      setInfoMsg("");
      try {
        const res = await api.get("/drones");
        if (!alive) return;

        const arr = Array.isArray(res.data) ? res.data : [];
        arr.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        setDrones(arr);
      } catch {
        if (!alive) return;
        setDrones([]);
        setInfoMsg(
          t("home.info.couldNotLoad", {
            defaultValue: L("No se pudo cargar el listado.", "Could not load the list."),
          })
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, i18n.resolvedLanguage]);

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const q = raw.startsWith("#") ? raw.slice(1).trim() : raw;

    const base = [...drones];
    if (!q) return base;

    return base.filter((d) => {
      const idText = String(d.id ?? "");
      const text = `${idText} ${d.name ?? ""} ${d.comment ?? ""} ${d.controller ?? ""} ${d.video ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

  return (
    <div className="grid gap-6">
      {/* Hero / panel principal */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        {/* Radial visible: centro más claro, bordes más oscuros */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative grid gap-5 md:grid-cols-[1.6fr_0.9fr] md:items-start">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight">{t("appName", { defaultValue: "DronHangar" })}</h1>

            <p className="text-sm text-muted-foreground">
              {t("home.hero.desc", {
                defaultValue: L(
                  "Consulta rápida del sistema. Para crear, editar o borrar drones necesitas iniciar sesión y acceder a ",
                  "Quick system lookup. To create, edit, or delete drones you need to sign in and use "
                ),
              })}
              <span className="font-bold text-foreground">{t("nav.manage", { defaultValue: L("Gestión", "Manage") })}</span>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {loggedIn ? (
                <>
                  <Button onClick={() => navigate("/manage")}>
                    {t("home.cta.goManage", { defaultValue: L("Ir a Gestión", "Go to Manage") })}
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    {t("home.cta.logout", { defaultValue: L("Cerrar sesión", "Sign out") })}
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/login")}>
                  {t("home.cta.loginOrRegister", {
                    defaultValue: L("Iniciar sesión / Crear cuenta", "Sign in / Create account"),
                  })}
                </Button>
              )}
            </div>
          </div>

          {/* Panel derecho: mensaje general */}
          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="font-semibold text-foreground">
                {t("home.security.title", { defaultValue: L("Acceso protegido", "Protected access") })}
              </div>
              <div className="mt-1">
                {t("home.security.desc", {
                  defaultValue: L(
                    "CRUD completo en Gestión con sesión (JWT).",
                    "Full CRUD in Manage with a signed-in session (JWT)."
                  ),
                })}
              </div>
              <div className="mt-2">
                {t("home.security.tipPrefix", { defaultValue: L("Consejo:", "Tip:") })}{" "}
                {t("home.security.tip", {
                  defaultValue: L(
                    "en el listado puedes buscar por texto o #id.",
                    "in the list you can search by text or #id."
                  ),
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="text-xs font-semibold text-muted-foreground">
            {t("home.howItWorks.kicker", { defaultValue: L("Cómo funciona", "How it works") })}
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
            {t("home.howItWorks.title", { defaultValue: L("Tu hangar en 3 pasos", "Your hangar in 3 steps") })}
          </h2>

          <ol className="mt-4 grid gap-3">
            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  1
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">
                    {t("home.howItWorks.step1.title", { defaultValue: L("Inicia sesión", "Sign in") })}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t("home.howItWorks.step1.desc", {
                      defaultValue: L(
                        "Accede a tu espacio privado para gestionar tus drones.",
                        "Access your private space to manage your drones."
                      ),
                    })}
                  </div>
                </div>
              </div>
            </li>

            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  2
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">
                    {t("home.howItWorks.step2.title", { defaultValue: L("Crea tus drones", "Create your drones") })}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t("home.howItWorks.step2.desc", {
                      defaultValue: L(
                        "Guarda nombre, controladora, vídeo, radio, componentes y notas.",
                        "Store name, flight controller, video, radio, components, and notes."
                      ),
                    })}
                  </div>
                </div>
              </div>
            </li>

            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">
                    {t("home.howItWorks.step3.title", { defaultValue: L("Sube dumps y parsea", "Upload dumps and parse") })}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t("home.howItWorks.step3.desc", {
                      defaultValue: L(
                        "Adjunta tus dumps por dron y usa la pantalla de parseo cuando la tengas preparada.",
                        "Attach dumps per drone and use the parse screen when it’s ready."
                      ),
                    })}
                  </div>
                </div>
              </div>
            </li>
          </ol>

          {!loggedIn ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate("/login")}>
                {t("home.howItWorks.ctaStart", { defaultValue: L("Empezar", "Get started") })}
              </Button>
              <Button variant="outline" onClick={() => navigate("/login")}>
                {t("home.howItWorks.ctaHaveAccount", { defaultValue: L("Ya tengo cuenta", "I already have an account") })}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Imágenes (public/) */}
        <div className="grid gap-4">
          <div className="relative overflow-hidden rounded-3xl bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
            <img
              src="/img1.jpeg"
              alt={t("home.images.alt1", { defaultValue: L("Drone en montaje", "Drone being assembled") })}
              className="h-64 w-full object-cover sm:h-72"
              loading="lazy"
              draggable="false"
            />
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
            <img
              src="/img2.jpeg"
              alt={t("home.images.alt2", { defaultValue: L("Drones preparados para volar", "Drones ready to fly") })}
              className="h-64 w-full object-cover sm:h-72"
              loading="lazy"
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">
            {t("home.cards.quick.title", { defaultValue: L("Consulta rápida", "Quick lookup") })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t("home.cards.quick.desc", { defaultValue: L("Filtra por texto en tiempo real.", "Filter by text in real time.") })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">
            {t("home.cards.protected.title", { defaultValue: L("Acceso protegido", "Protected access") })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t("home.cards.protected.desc", {
              defaultValue: L("Crear/editar/borrar solo en Gestión.", "Create/edit/delete only in Manage."),
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">{t("home.cards.dumps.title", { defaultValue: "Dumps" })}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t("home.cards.dumps.desc", { defaultValue: L("Pantallas preparadas para ver y parsear.", "Screens ready to view and parse.") })}
          </div>
        </div>
      </div>

      {/* Listado: SOLO si hay sesión */}
      {loggedIn ? (
        <Card title={t("home.list.title", { defaultValue: L("Listado (solo lectura)", "List (read-only)") })} className="bg-white shadow-xl ring-1 ring-black/10">
          <div className="grid gap-4">
            <Input
              label={t("home.list.searchLabel", { defaultValue: L("Buscar", "Search") })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("home.list.searchPlaceholder", {
                defaultValue: L("Nombre, comentario… (ej: cinewhoop o #1)", "Name, notes… (e.g. cinewhoop or #1)"),
              })}
            />

            {infoMsg ? (
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-black/10">{infoMsg}</div>
            ) : null}

            {loading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: L("Cargando…", "Loading…") })}</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {query.trim()
                  ? t("home.list.noResults", { defaultValue: L("No hay resultados para esa búsqueda.", "No results for that search.") })
                  : t("home.list.noDrones", { defaultValue: L("No hay drones para mostrar.", "No drones to display.") })}
              </p>
            ) : (
              <ul className="divide-y divide-black/10 rounded-2xl bg-white shadow-sm ring-1 ring-black/10">
                {filtered.map((d) => (
                  <li key={d.id} className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-base font-extrabold">{d.name || "—"}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {d.comment
                            ? d.comment
                            : t("home.list.noComment", { defaultValue: L("Sin comentario", "No notes") })}
                        </div>
                      </div>

                      <div className="shrink-0 text-sm font-semibold text-muted-foreground">#{d.id}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
