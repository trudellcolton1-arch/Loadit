"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const CODE_KEY = "loadit_dataroom_code";
const ADMIN_KEY = "loadit_dataroom_admin";

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
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "investor" | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ sectionId: number; folder: string } | null>(null);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem(CODE_KEY);
      const a = sessionStorage.getItem(ADMIN_KEY);
      if (a) setAdminKey(a);
      if (c) setEntered(c);
      if (!c && !a) return;
    } catch { /* gate stays up */ }
  }, []);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (adminKey) h["x-dataroom-admin"] = adminKey;
    if (entered) h["x-dataroom-code"] = entered;
    return h;
  }, [adminKey, entered]);

  const refresh = useCallback(async () => {
    if (!entered && !adminKey) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/dataroom", { headers: headers(), cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          setRole(null);
          setErr("That code isn't valid. Check it and try again.");
          try { sessionStorage.removeItem(CODE_KEY); sessionStorage.removeItem(ADMIN_KEY); } catch { /* ok */ }
          setEntered(null);
          setAdminKey(null);
        } else {
          setErr("The room is unavailable right now — try again shortly.");
        }
        return;
      }
      setRole(data.role);
      setSections(data.sections);
    } catch {
      setErr("Couldn't reach the room — check your connection.");
    } finally {
      setLoading(false);
    }
  }, [entered, adminKey, headers]);

  useEffect(() => { refresh(); }, [refresh]);

  const enter = () => {
    const v = code.trim();
    if (!v) return;
    // One field, two doors: admin keys are long and prefixed; investor codes are short.
    if (v.startsWith("dradm_")) {
      setAdminKey(v);
      try { sessionStorage.setItem(ADMIN_KEY, v); } catch { /* ok */ }
    } else {
      setEntered(v);
      try { sessionStorage.setItem(CODE_KEY, v); } catch { /* ok */ }
    }
    setCode("");
  };

  const admin = role === "admin";

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
