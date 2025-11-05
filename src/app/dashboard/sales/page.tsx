"use client";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseclient";
import GenerateReceipt from "@/components/generate-reciept";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);

  // 🔹 Filter states
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [product, setProduct] = useState<string>("");

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        id,
        customer_name,
        merchant_name,
        subtotal,
        discount,
        total,
        date,
        sale_items (
          product_name,
          unit_price,
          quantity
        )
      `)
      .order("date", { ascending: false });

    if (error) console.error("Error fetching sales:", error);
    else setSales(data);
  };

  // 🔹 Dynamic year options
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(sales.map((s) => new Date(s.date).getFullYear()))
    );
    return years.sort((a, b) => b - a);
  }, [sales]);

  // 🔹 Unique customers and products for dropdowns
  const uniqueCustomers = useMemo(() => {
    return Array.from(
      new Set(sales.map((s) => s.customer_name).filter(Boolean))
    );
  }, [sales]);

  const uniqueProducts = useMemo(() => {
    return Array.from(
      new Set(
        sales.flatMap((s) =>
          (s.sale_items || []).map((i: any) => i.product_name)
        )
      )
    );
  }, [sales]);

  // 🔹 Apply all filters together
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const d = new Date(sale.date);
      const saleMonth = (d.getMonth() + 1).toString();
      const saleYear = d.getFullYear().toString();

      const matchesMonth = !month || saleMonth === month;
      const matchesYear = !year || saleYear === year;
      const matchesCustomer =
        !customer ||
        sale.customer_name?.toLowerCase().includes(customer.toLowerCase());
      const matchesProduct =
        !product ||
        sale.sale_items?.some((item: any) =>
          item.product_name.toLowerCase().includes(product.toLowerCase())
        );

      return matchesMonth && matchesYear && matchesCustomer && matchesProduct;
    });
  }, [sales, month, year, customer, product]);

  // 🔹 Label for the top heading
  const filterLabel = useMemo(() => {
    const monthName =
      month &&
      new Date(0, parseInt(month) - 1).toLocaleString("default", {
        month: "long",
      });
    if (!month && !year) return "All Sales Records";
    return `${monthName ? monthName + " " : ""}${year || ""}`.trim();
  }, [month, year]);

  return (
    <div className="p-6 text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold">{filterLabel}</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded-md p-2"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border rounded-md p-2"
          >
            <option value="">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Customer */}
          <input
            type="text"
            placeholder="Filter by customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="border rounded-md p-2 w-40"
          />

          {/* Product */}
          <input
            type="text"
            placeholder="Filter by product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="border rounded-md p-2 w-40"
          />

          <GenerateReceipt sales={filteredSales} />
        </div>
      </div>

      {/* Table */}
      <table className="min-w-full border border-gray-300 rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Seller</th>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Unit Price</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">Subtotal</th>
            <th className="p-2 border">Discount</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>

        <tbody>
          {filteredSales.map((sale: any) => (
            <React.Fragment key={sale.id}>
              {sale.sale_items?.map((item: any, i: number) => (
                <tr key={`${sale.id}-${i}`}>
                  {i === 0 && (
                    <>
                      <td
                        className="p-2 border align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        {new Date(sale.date).toLocaleString()}
                      </td>
                      <td
                        className="p-2 border align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        {sale.customer_name}
                      </td>
                      <td
                        className="p-2 border align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        {sale.merchant_name}
                      </td>
                    </>
                  )}

                  <td className="p-2 border">{item.product_name}</td>
                  <td className="p-2 border">
                    ₦{Number(item.unit_price).toLocaleString()}
                  </td>
                  <td className="p-2 border">{item.quantity}</td>

                  {i === 0 && (
                    <>
                      <td
                        className="p-2 border align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        ₦{Number(sale.subtotal).toLocaleString()}
                      </td>
                      <td
                        className="p-2 border align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        ₦{Number(sale.discount).toLocaleString()}
                      </td>
                      <td
                        className="p-2 border font-bold align-top"
                        rowSpan={sale.sale_items.length}
                      >
                        ₦{Number(sale.total).toLocaleString()}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {filteredSales.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          No sales found for this selection.
        </p>
      )}
    </div>
  );
}
