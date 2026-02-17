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
      .from("sales_orders")
      .select("id, reference, status, total_amount, customers(name)")
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
        customer_name: data.customers?.name || ""
      }
    });
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .select("id, reference, status, total_amount, customers(name)")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped = (data || []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    total_amount: row.total_amount,
    customer_name: row.customers?.name || ""
  }));
  return NextResponse.json({ data: mapped });
}

export async function POST(req: Request) {
  const auth = await requireRole(req, ["admin", "manager"]);
  if (!auth.ok) return auth.response;
  const body = await req.json();
  const { reference, customer_name, status, total_amount } = body;

  let customerId: string | null = null;
  if (customer_name) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("name", customer_name)
      .maybeSingle();
    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
        .from("customers")
        .insert({ name: customer_name })
        .select("id")
        .single();
      if (newCustomerError) {
        return NextResponse.json({ error: newCustomerError.message }, { status: 500 });
      }
      customerId = newCustomer.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .insert({
      reference,
      customer_id: customerId,
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
  const { id, reference, customer_name, status, total_amount } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let customerId: string | null = null;
  if (customer_name) {
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("name", customer_name)
      .maybeSingle();
    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (customer) {
      customerId = customer.id;
    } else {
      const { data: newCustomer, error: newCustomerError } = await supabaseAdmin
        .from("customers")
        .insert({ name: customer_name })
        .select("id")
        .single();
      if (newCustomerError) {
        return NextResponse.json({ error: newCustomerError.message }, { status: 500 });
      }
      customerId = newCustomer.id;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("sales_orders")
    .update({
      reference,
      customer_id: customerId,
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
  const { error } = await supabaseAdmin.from("sales_orders").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: { id } });
}
