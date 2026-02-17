"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ProductRow = {
  sku: string;
  name: string;
};

export default function LabelsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState("");
  const [count, setCount] = useState(1);

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/products");
      const data = await res.json();
      if (res.ok) {
        setProducts((data.data || []).map((p: any) => ({ sku: p.sku, name: p.name })));
      }
    };
    load();
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === selected),
    [products, selected]
  );

  const labels = Array.from({ length: Math.max(1, count) });

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="panel">
        <h1>Barcode Labels</h1>
        <p className="muted">Generate and print barcode labels.</p>
      </div>

      <div className="panel form">
        <div>
          <label className="text-sm font-medium">Product</label>
          <input
            className="input mt-2"
            list="product-labels"
            placeholder="SKU"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
          <datalist id="product-labels">
            {products.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.name}
              </option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-sm font-medium">Label count</label>
          <input
            className="input mt-2"
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Number(e.target.value || 1))}
          />
        </div>
        <button className="button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="panel print-area">
        <div className="label-grid">
          {labels.map((_, idx) => (
            <div className="label-card" key={`${selected}-${idx}`}>
              <div className="label-title">{selectedProduct?.name || "Product"}</div>
              <img
                className="label-barcode"
                src={selected ? `/api/barcode?text=${encodeURIComponent(selected)}` : ""}
                alt={selected}
              />
              <div className="label-sku">{selected || "SKU"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
