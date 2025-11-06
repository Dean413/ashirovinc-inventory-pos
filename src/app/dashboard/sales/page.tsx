"use client";
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseclient";
import GenerateReceipt from "@/components/generate-reciept";
import Select from "react-select";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDate, setCustomDate] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [product, setProduct] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
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
    else setSales(data || []);
  };

  // Unique customers and products
  const uniqueCustomers = useMemo(() => {
    const names = sales
      .map((s) => s.customer_name?.trim())
      .filter(Boolean)
      .map((n) => n.toLowerCase());

    return Array.from(new Set(names)).map(
      (n) => n.charAt(0).toUpperCase() + n.slice(1)
    );
  }, [sales]);

  const uniqueProducts = useMemo(() => {
    const items = sales.flatMap((s) =>
      (s.sale_items || []).map((i: any) => i.product_name?.trim())
    );
    return Array.from(new Set(items.filter(Boolean)));
  }, [sales]);

  // Filter sales
  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter((sale) => {
      const d = new Date(sale.date);

      let matchesDate = true;
      switch (timeFilter) {
        case "today":
          matchesDate = d.toDateString() === now.toDateString();
          break;
        case "month":
          matchesDate =
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
          break;
        case "year":
          matchesDate = d.getFullYear() === now.getFullYear();
          break;
        case "custom":
          if (customDate) {
            const target = new Date(customDate);
            matchesDate = d.toDateString() === target.toDateString();
          }
          break;
        default:
          matchesDate = true; // all time
      }

      const matchesCustomer =
        !customer ||
        sale.customer_name?.toLowerCase().includes(customer.toLowerCase());
      const matchesProduct =
        !product ||
        sale.sale_items?.some((item: any) =>
          item.product_name.toLowerCase().includes(product.toLowerCase())
        );

      return matchesDate && matchesCustomer && matchesProduct;
    });
  }, [sales, timeFilter, customDate, customer, product]);

  // Total sales for filtered results
  const totalSales = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  }, [filteredSales]);

  // Label
  const filterLabel = useMemo(() => {
    switch (timeFilter) {
      case "today":
        return "Today's Sales";
      case "month":
        return "This Month's Sales";
      case "year":
        return "This Year's Sales";
      case "custom":
        return customDate
          ? `Sales on ${new Date(customDate).toLocaleDateString()}`
          : "Custom Date Sales";
      default:
        return "All Sales Records";
    }
  }, [timeFilter, customDate]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 w-full">
        <h2 className="text-2xl font-bold">{filterLabel}</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="min-w-[180px]">
            {isClient && (
              <Select
                value={{ value: timeFilter, label: timeFilter }}
                onChange={(option) => setTimeFilter(option?.value || "All")}
                options={[
                  { value: "All", label: "All Time" },
                  { value: "Today", label: "Today" },
                  { value: "month", label: "This Month" },
                  { value: "year", label: "This Year" },
                  { value: "custom", label: "Custom Date" },
                ]}
                classNamePrefix="react-select"
              />
            )}
          </div>

          {timeFilter === "custom" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          )}

          {/* Customer Filter */}
          <div className="min-w-[200px]">
            {isClient && (
              <Select
                isClearable
                isSearchable
                placeholder="Filter by Customer"
                value={customer ? { value: customer, label: customer } : null}
                onChange={(option) => setCustomer(option ? option.value : "")}
                options={uniqueCustomers.map((c) => ({
                  value: c,
                  label: c,
                }))}
                classNamePrefix="react-select"
              />
            )}
          </div>

          {/* Product Filter */}
          <div className="min-w-[200px]">
            {isClient && (
              <Select
                isClearable
                isSearchable
                placeholder="Filter by Product"
                value={product ? { value: product, label: product } : null}
                onChange={(option) => setProduct(option ? option.value : "")}
                options={uniqueProducts.map((p) => ({
                  value: p,
                  label: p,
                }))}
                classNamePrefix="react-select"
              />
            )}
          </div>

          <GenerateReceipt sales={filteredSales} />
        </div>
      </div>

      {/* Total Display */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg w-full">
        <p className="text-lg font-semibold text-blue-800">
          Total Sales ({filterLabel}):{" "}
          <span className="ml-2 text-2xl text-blue-700">
            ₦{totalSales.toLocaleString("en-NG")}
          </span>
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-6 bg-white rounded-xl shadow-md border border-gray-200 w-full">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-blue-50 text-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Seller</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-right">Unit Price</th>
              <th className="px-4 py-2 text-right">Quantity</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
              <th className="px-4 py-2 text-right">Discount</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-gray-50">
            {filteredSales.map((sale: any) => (
              <React.Fragment key={sale.id}>
                {sale.sale_items?.map((item: any, i: number) => (
                  <tr key={`${sale.id}-${i}`} className="hover:bg-blue-50 transition">
                    {i === 0 && (
                      <>
                        <td
                          className="px-4 py-2 align-top"
                          rowSpan={sale.sale_items.length}
                        >
                          {new Date(sale.date).toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-2 align-top"
                          rowSpan={sale.sale_items.length}
                        >
                          {sale.customer_name || "-"}
                        </td>
                        <td
                          className="px-4 py-2 align-top"
                          rowSpan={sale.sale_items.length}
                        >
                          {sale.merchant_name || "-"}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2 text-right">
                      ₦{Number(item.unit_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    {i === 0 && (
                      <>
                        <td
                          className="px-4 py-2 text-right align-top"
                          rowSpan={sale.sale_items.length}
                        >
                          ₦{Number(sale.subtotal).toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-2 text-right align-top"
                          rowSpan={sale.sale_items.length}
                        >
                          ₦{Number(sale.discount).toLocaleString()}
                        </td>
                        <td
                          className="px-4 py-2 text-right font-bold text-blue-700 align-top"
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
      </div>

      {filteredSales.length === 0 && (
        <p className="text-center text-gray-500 mt-6">
          No sales found for this selection.
        </p>
      )}
    </div>
  );
}
