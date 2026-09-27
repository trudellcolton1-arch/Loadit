"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NDA_VERSION, NDA_TITLE, NDA_EFFECTIVE, NDA_INTRO, NDA_CLAUSES } from "@/lib/nda";

/**
 * DATA ROOM CLIENT — gate first, room second.
 *
 * The access code (investor) or admin key lives in sessionStorage for the
 * tab's life and travels as a request header on every API call — the server
 * re-checks it on every read and download. Admin controls render only when
 * the server says role=admin; the server enforces it regardless.
 */

interface DocMeta {
  id: string;
  sectionId: number;
  folder: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
}
interface Section {
  id: number;
  title: string;
  position: number;
  documents: DocMeta[];
}

const KEY_STORE = "loadit_dataroom_key";
const NDA_STORE = `loadit_dataroom_nda_${NDA_VERSION}`;

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function DataRoomClient() {
  const [code, setCode] = useState("");
  const [entered, setEntered] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "investor" | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ sectionId: number; folder: string } | null>(null);

  // NDA click-through gate (investors only; the owner's own room is exempt).
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [ndaName, setNdaName] = useState("");
  const [ndaEmail, setNdaEmail] = useState("");
  const [ndaEntity, setNdaEntity] = useState("");
  const [ndaReadToEnd, setNdaReadToEnd] = useState(false);
  const [acceptances, setAcceptances] = useState<
    { id: string; name: string; email: string; entity: string; ndaVersion: string; acceptedAt: string }[]
  >([]);

  useEffect(() => {
    try {
      const k = sessionStorage.getItem(KEY_STORE);
      if (k) setEntered(k);
      if (localStorage.getItem(NDA_STORE)) setNdaAccepted(true);
    } catch { /* gate stays up */ }
  }, []);

  // One field, two doors: the server decides which role a code unlocks,
  // so the same value rides both headers and the right one matches.
  const headers = useCallback((): Record<string, string> => {
    if (!entered) return {};
    return { "x-dataroom-admin": entered, "x-dataroom-code": entered };
  }, [entered]);

  const refresh = useCallback(async () => {
    if (!entered) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/dataroom", { headers: headers(), cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          setRole(null);
          setErr("That code isn't valid. Check it and try again.");
          try { sessionStorage.removeItem(KEY_STORE); } catch { /* ok */ }
          setEntered(null);
        } else {
          setErr("The room is unavailable right now — try again shortly.");
        }
        return;
      }
      setRole(data.role);
      setSections(data.sections);
      if (Array.isArray(data.ndaAcceptances)) setAcceptances(data.ndaAcceptances);
    } catch {
      setErr("Couldn't reach the room — check your connection.");
    } finally {
      setLoading(false);
    }
  }, [entered, headers]);

  useEffect(() => { refresh(); }, [refresh]);

  const enter = () => {
    const v = code.trim();
    if (!v) return;
    setEntered(v);
    try { sessionStorage.setItem(KEY_STORE, v); } catch { /* ok */ }
    setCode("");
  };

  const admin = role === "admin";
  // Investors must accept the NDA; the owner's own room is exempt.
  const ndaRequired = role === "investor" && !ndaAccepted;

  const acceptNda = async () => {
    const name = ndaName.trim();
    const email = ndaEmail.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr("Enter your full name and a valid email to accept.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/dataroom", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ action: "accept_nda", name, email, folder: ndaEntity.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr("Couldn't record your acceptance — try again.");
        return;
      }
      try { localStorage.setItem(NDA_STORE, new Date().toISOString()); } catch { /* ok */ }
      setNdaAccepted(true);
    } catch {
      setErr("Couldn't reach the room — try again.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (body: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/dataroom", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErr(data.reason === "file_too_large_3mb_cap"
          ? "That file is over the 3 MB per-file cap."
          : "That didn't work — try again.");
        return false;
      }
      await refresh();
      return true;
    } catch {
      setErr("Couldn't reach the room — try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addSection = async () => {
    const title = window.prompt("Section title (e.g. Corporate & Formation)");
    if (title?.trim()) await act({ action: "add_section", title });
  };

  const startUpload = (sectionId: number) => {
    const folder = window.prompt("Folder name (blank for none)") ?? "";
    setUploadTarget({ sectionId, folder: folder.trim() });
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !uploadTarget) return;
    if (f.size > 3 * 1024 * 1024) {
      setErr("That file is over the 3 MB per-file cap.");
      return;
    }
    const buf = await f.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    }
    await act({
      action: "upload",
      sectionId: uploadTarget.sectionId,
      folder: uploadTarget.folder,
      name: f.name,
      mime: f.type || "application/octet-stream",
      contentB64: btoa(bin),
    });
    setUploadTarget(null);
  };

  const openDoc = async (doc: DocMeta, download: boolean) => {
    setErr(null);
    try {
      const res = await fetch(`/api/dataroom/file/${doc.id}`, { headers: headers() });
      if (!res.ok) { setErr("Not authorized for that document."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.click();
      } else {
        window.open(url, "_blank", "noopener");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setErr("Download failed — try again.");
    }
  };

  const stats = useMemo(() => {
    const docs = sections.flatMap((s) => s.documents);
    const folders = new Set(
      docs.filter((d) => d.folder).map((d) => `${d.sectionId}/${d.folder}`)
    );
    return {
      sections: sections.length,
      folders: folders.size,
      documents: docs.length,
      size: docs.reduce((a, d) => a + d.sizeBytes, 0),
    };
  }, [sections]);

  /* ------------------------------------------------------------- gate */
  if (!role) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pb-24">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
          Loadit Global · Diligence Library
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Data Room</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          The Loadit record, in one place — corporate, intellectual property, technology,
          commercial, regulatory, financial, and security materials for authorized review.
        </p>
        <div className="mt-8 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enter()}
            type="password"
            placeholder="Access code"
            className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50"
          />
          <button
            onClick={enter}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#05270F] hover:bg-emerald-300"
          >
            Enter
          </button>
        </div>
        {loading && <p className="mt-4 text-xs text-white/40">Checking…</p>}
        {err && <p className="mt-4 text-xs text-rose-300">{err}</p>}
        <p className="mt-10 text-[11px] leading-relaxed text-white/30">
          Private and confidential. Materials are intended solely for authorized review,
          diligence, and discussion, and may contain confidential, proprietary, technical,
          commercial, legal, or financial information. Access is logged.
        </p>
      </div>
    );
  }

  /* --------------------------------------------------------- NDA gate */
  if (ndaRequired) {
    const canAccept = ndaReadToEnd && ndaName.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ndaEmail.trim());
    return (
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-12">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
          Loadit Global · Diligence Library
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">{NDA_TITLE}</h1>
        <p className="mt-1 text-xs text-white/40">
          Version {NDA_VERSION} · Effective {NDA_EFFECTIVE} · You must accept to view the materials.
        </p>

        <div
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setNdaReadToEnd(true);
          }}
          className="mt-5 max-h-[46vh] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-white/70"
        >
          <p className="text-white/80">{NDA_INTRO}</p>
          {NDA_CLAUSES.map((c) => (
            <div key={c.heading} className="mt-4">
              <p className="font-bold text-emerald-300/90">{c.heading}</p>
              <p className="mt-1">{c.body}</p>
            </div>
          ))}
          <p className="mt-5 text-[11px] text-white/35">— End of agreement —</p>
        </div>
        {!ndaReadToEnd && (
          <p className="mt-2 text-[11px] text-white/35">Scroll to the end of the agreement to enable acceptance.</p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            value={ndaName} onChange={(e) => setNdaName(e.target.value)}
            placeholder="Full legal name"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50"
          />
          <input
            value={ndaEmail} onChange={(e) => setNdaEmail(e.target.value)}
            placeholder="Email" type="email" autoCapitalize="none"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50"
          />
          <input
            value={ndaEntity} onChange={(e) => setNdaEntity(e.target.value)}
            placeholder="Entity / firm (optional)"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/50 sm:col-span-2"
          />
        </div>

        <button
          onClick={acceptNda}
          disabled={!canAccept || busy}
          className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-bold text-[#05270F] disabled:opacity-40 hover:bg-emerald-300"
        >
          {busy ? "Recording…" : "I Agree — Enter the Data Room"}
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-white/35">
          Clicking &ldquo;I Agree&rdquo; is your electronic signature and records your name, email, and the
          date and time as binding acceptance of this Agreement.
        </p>
        {err && <p className="mt-3 text-xs text-rose-300">{err}</p>}
        <button
          onClick={() => { try { sessionStorage.removeItem(KEY_STORE); } catch { /* ok */ } setEntered(null); setRole(null); }}
          className="mt-6 text-xs text-white/40 underline"
        >
          Decline and exit
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------- room */
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-14">
      <input ref={fileInput} type="file" hidden onChange={onFile} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
            Loadit Global · Diligence Library
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">The Loadit record, in one place.</h1>
        </div>
        {admin && (
          <span className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">
            Admin
          </span>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [stats.sections, "Sections"],
            [stats.folders, "Folders"],
            [stats.documents, "Documents"],
            [fmtBytes(stats.size), "Stored"],
          ] as const
        ).map(([v, label]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-2xl font-black text-white">{v}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {admin && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={addSection} disabled={busy}
            className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:border-emerald-300">
            + Add section
          </button>
          <span className="self-center text-[11px] text-white/35">Uploads: 3 MB per file. Stored privately; served only to authorized codes.</span>
        </div>
      )}

      {admin && (
        <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-bold text-white">
            NDA acceptances <span className="text-white/40">({acceptances.length})</span>
          </summary>
          {acceptances.length === 0 ? (
            <p className="mt-3 text-xs text-white/40">No one has accepted the NDA yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                  <tr>
                    <th className="py-1 pr-4">Name</th>
                    <th className="py-1 pr-4">Email</th>
                    <th className="py-1 pr-4">Entity</th>
                    <th className="py-1 pr-4">Version</th>
                    <th className="py-1">Accepted</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptances.map((a) => (
                    <tr key={a.id} className="border-t border-white/8">
                      <td className="py-1.5 pr-4 font-semibold text-white">{a.name}</td>
                      <td className="py-1.5 pr-4">{a.email}</td>
                      <td className="py-1.5 pr-4">{a.entity || "—"}</td>
                      <td className="py-1.5 pr-4">{a.ndaVersion}</td>
                      <td className="py-1.5">{fmtDate(a.acceptedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>
      )}

      {err && <p className="mt-4 text-xs text-rose-300">{err}</p>}
      {loading && <p className="mt-4 text-xs text-white/40">Refreshing…</p>}
      {!sections.length && !loading && (
        <p className="mt-10 text-sm text-white/45">
          {admin ? "Empty room — add a section to begin." : "Documents are being prepared. Check back shortly."}
        </p>
      )}

      {sections.map((s) => {
        const folders = Array.from(new Set(s.documents.map((d) => d.folder))).sort();
        return (
          <section key={s.id} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-white">{s.title}</h2>
              {admin && (
                <div className="flex gap-2">
                  <button onClick={() => startUpload(s.id)} disabled={busy}
                    className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:border-white/40">
                    Upload
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete section "${s.title}" and all its documents?`))
                        await act({ action: "delete_section", sectionId: s.id });
                    }}
                    disabled={busy}
                    className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300/80 hover:border-rose-300/60">
                    Delete
                  </button>
                </div>
              )}
            </div>
            {!s.documents.length && (
              <p className="mt-3 text-xs text-white/35">No documents yet.</p>
            )}
            {folders.map((folder) => (
              <div key={folder || "_root"} className="mt-4">
                {folder ? (
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    {folder}
                  </p>
                ) : null}
                {s.documents.filter((d) => d.folder === folder).map((d) => (
                  <div key={d.id}
                    className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {fmtBytes(d.sizeBytes)} · {fmtDate(d.uploadedAt)}
                      </p>
                    </div>
                    <button onClick={() => openDoc(d, false)}
                      className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:border-white/40">
                      View
                    </button>
                    <button onClick={() => openDoc(d, true)}
                      className="rounded-lg border border-emerald-400/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:border-emerald-300">
                      Download
                    </button>
                    {admin && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete "${d.name}"?`)) await act({ action: "delete_doc", docId: d.id });
                        }}
                        className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] font-bold text-rose-300/80 hover:border-rose-300/60">
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>
        );
      })}

      <p className="mt-12 text-[11px] leading-relaxed text-white/30">
        Private and confidential. Materials contained in this data room are intended solely for
        authorized review, diligence, and discussion. Information may contain confidential,
        proprietary, technical, commercial, legal, or financial material. Do not redistribute.
      </p>
    </div>
  );
}
