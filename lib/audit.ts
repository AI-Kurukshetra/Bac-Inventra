import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function logAudit(params: {
  orgId: string;
  actorId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  metadata?: Record<string, any>;
}) {
  const { orgId, actorId, entityType, entityId, action, metadata } = params;
  await supabaseAdmin.from("audit_logs").insert({
    org_id: orgId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId || null,
    action,
    metadata: metadata || {}
  });
}
