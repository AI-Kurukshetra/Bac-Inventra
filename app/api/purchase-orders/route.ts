import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole } from "@/lib/requireRole";

export async function GET(req: Request) {
  const auth = await requireRole(req, ["admin", "manager", "staff"]);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .select("id, reference, status, total_amount, suppliers(name)")
      .eq("id", id)
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      data: {
        id: data.id,
        reference: data.reference,
        status: data.status,
        total_amount: data.total_amount,
        supplier_name: data.suppliers?.name || ""
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .select("id, reference, status, total_amount, suppliers(name)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    total_amount: row.total_amount,
    supplier_name: row.suppliers?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const { reference, supplier_name, status, total_amount } = body;

  let supplierId: string | null = null;
  if (supplier_name) {
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from("suppliers")
      .select("id")
      .eq("name", supplier_name)
      .maybeSingle();
    if (supplierError) {
      return NextResponse.json({ error: supplierError.message }, { status: 500 });
    }
    if (supplier) {
      supplierId = supplier.id;
    } else {
      const { data: newSupplier, error: newSupplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({ name: supplier_name })
        .select("id")
        .single();
      if (newSupplierError) {
        return NextResponse.json({ error: newSupplierError.message }, { status: 500 });
      }
      supplierId = newSupplier.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .insert({
      reference,
      supplier_id: supplierId,
      status: status || "draft",
      total_amount: total_amount ? Number(total_amount) : 0
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function PUT(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const { id, reference, supplier_name, status, total_amount } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let supplierId: string | null = null;
  if (supplier_name) {
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from("suppliers")
      .select("id")
      .eq("name", supplier_name)
      .maybeSingle();
    if (supplierError) {
      return NextResponse.json({ error: supplierError.message }, { status: 500 });
    }
    if (supplier) {
      supplierId = supplier.id;
    } else {
      const { data: newSupplier, error: newSupplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({ name: supplier_name })
        .select("id")
        .single();
      if (newSupplierError) {
        return NextResponse.json({ error: newSupplierError.message }, { status: 500 });
      }
      supplierId = newSupplier.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .update({
      reference,
      supplier_id: supplierId,
      status: status || "draft",
      total_amount: total_amount ? Number(total_amount) : 0
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("purchase_orders").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: { id } });
}
