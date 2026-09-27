import { NextRequest, NextResponse } from "next/server";
import {
  dataroomConfigured,
  dataroomRole,
  drQuery,
  ensureSchema,
  loadStructure,
  newDocId,
  recordNdaAcceptance,
  listNdaAcceptances,
  MAX_FILE_BYTES,
} from "@/lib/dataroom";
import { NDA_VERSION } from "@/lib/nda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/dataroom
 *
 * GET  — room structure (sections + document metadata, never content).
 *        Requires investor code or admin key.
 * POST — admin mutations only: add_section, rename_section, delete_section,
 *        upload, rename_doc, delete_doc.
 *
 * Every branch re-checks the role server-side; the client UI hiding a
 * button is cosmetic, not security.
 */

const deny = (status: number, reason: string) =>
  NextResponse.json({ ok: false, reason }, { status });

export async function GET(req: NextRequest) {
  if (!dataroomConfigured()) return deny(503, "not_configured");
  const role = dataroomRole(req.headers);
  if (!role) return deny(401, "unauthorized");
  const sections = await loadStructure();
  // The owner sees who has signed the NDA; investors never see the list.
  const ndaAcceptances = role === "admin" ? await listNdaAcceptances() : undefined;
  return NextResponse.json({ ok: true, role, sections, ndaAcceptances, ndaVersion: NDA_VERSION });
}

interface AdminBody {
  action?: string;
  sectionId?: number;
  title?: string;
  docId?: string;
  name?: string;
  email?: string;
  folder?: string;
  mime?: string;
  contentB64?: string;
}

export async function POST(req: NextRequest) {
  if (!dataroomConfigured()) return deny(503, "not_configured");
  const role = dataroomRole(req.headers);
  if (!role) return deny(401, "unauthorized");

  let body: AdminBody;
  try {
    body = (await req.json()) as AdminBody;
  } catch {
    return deny(400, "bad_json");
  }

  // Recording an NDA acceptance is open to any authorized role (an investor
  // signs before entering). Everything else below is admin-only.
  if (body.action === "accept_nda") {
    const name = (body.name || "").trim().slice(0, 160);
    const email = (body.email || "").trim().slice(0, 200);
    const entity = (body.folder || "").trim().slice(0, 200); // 'folder' reused as optional entity
    if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return deny(400, "name_and_valid_email_required");
    }
    const id = await recordNdaAcceptance({
      name, email, entity, role,
      ndaVersion: NDA_VERSION,
      userAgent: req.headers.get("user-agent") || "",
    });
    return NextResponse.json({ ok: true, acceptanceId: id, ndaVersion: NDA_VERSION });
  }

  if (role !== "admin") return deny(403, "admin_only");

  await ensureSchema();

  switch (body.action) {
    case "add_section": {
      const title = (body.title || "").trim().slice(0, 120);
      if (!title) return deny(400, "title_required");
      const [row] = await drQuery<{ id: number }>(
        `insert into dataroom_sections (title, position)
         values ($1, coalesce((select max(position) + 1 from dataroom_sections), 0))
         returning id`,
        [title]
      );
      return NextResponse.json({ ok: true, sectionId: Number(row.id) });
    }
    case "rename_section": {
      const title = (body.title || "").trim().slice(0, 120);
      if (!body.sectionId || !title) return deny(400, "sectionId_and_title_required");
      await drQuery("update dataroom_sections set title = $1 where id = $2", [title, body.sectionId]);
      return NextResponse.json({ ok: true });
    }
    case "delete_section": {
      if (!body.sectionId) return deny(400, "sectionId_required");
      await drQuery("delete from dataroom_sections where id = $1", [body.sectionId]);
      return NextResponse.json({ ok: true });
    }
    case "upload": {
      const name = (body.name || "").trim().slice(0, 200);
      const folder = (body.folder || "").trim().slice(0, 120);
      const mime = (body.mime || "application/octet-stream").slice(0, 120);
      if (!body.sectionId || !name || !body.contentB64) {
        return deny(400, "sectionId_name_content_required");
      }
      const sizeBytes = Math.floor((body.contentB64.length * 3) / 4);
      if (sizeBytes > MAX_FILE_BYTES) return deny(413, "file_too_large_3mb_cap");
      const id = newDocId();
      await drQuery(
        `insert into dataroom_documents (id, section_id, folder, name, mime, size_bytes, content_b64)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [id, body.sectionId, folder, name, mime, sizeBytes, body.contentB64]
      );
      return NextResponse.json({ ok: true, docId: id });
    }
    case "rename_doc": {
      const name = (body.name || "").trim().slice(0, 200);
      if (!body.docId || !name) return deny(400, "docId_and_name_required");
      await drQuery("update dataroom_documents set name = $1 where id = $2", [name, body.docId]);
      return NextResponse.json({ ok: true });
    }
    case "delete_doc": {
      if (!body.docId) return deny(400, "docId_required");
      await drQuery("delete from dataroom_documents where id = $1", [body.docId]);
      return NextResponse.json({ ok: true });
    }
    default:
      return deny(400, "unknown_action");
  }
}
