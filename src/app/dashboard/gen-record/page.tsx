"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { supaBase } from "@/lib/supabaseclient";

export default function ServicesSpreadsheet() {
  const headers = [
    "Date In",
    "Product",
    "Name",
    "Description",
    "Qty",
    "Service Charge",
    "Payment Method",
    "Location",
    "Job Owner",
    "Serviced By",
    "Expense Cost",
    "Profit",
    "Staff Commission",
    "Ashirov Profit",
    "Remark",
    "Date Out",
  ];

  const remarkOptions = ["Job Done", "Debtor", "Work In Progress", "Delivered"];
  const jobOwnerOptions = ["In-house", "Personal"];

  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");

  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧩 Fetch initial data
  const fetchGenRecord = async () => {
    const { data, error } = await supabase
      .from("general_record")
      .select("*")
      .order("id");

    if (error) {
      console.error("Error fetching general_record:", error.message);
    } else {
      setRows(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGenRecord();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [servicesRes, productsRes, merchantsRes] = await Promise.all([
        supabase.from("general_record").select("*").order("created_at", { ascending: false }),
        supaBase.from("products").select("id, name"),
        supabase.from("merchants").select("id, name"),
      ]);

      if (servicesRes.data) setRows(servicesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (merchantsRes.data) setMerchants(merchantsRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // ➕ Add new empty row
  const addRow = () => setRows([...rows, {}]);

  // ✏️ Handle input change
  const handleInputChange = (index: number, field: string, value: string | number) => {
    const updated = [...rows];
    updated[index][field] = value;

    // Auto calculations
    const serviceCharge = parseFloat(updated[index].service_charge) || 0;
    const expenseCost = parseFloat(updated[index].expense_cost) || 0;
    const profit = serviceCharge - expenseCost;
    updated[index].profit = profit;

    const jobOwner = updated[index].job_owner;
    let staffCommission = 0;

    if (jobOwner === "In-house") staffCommission = profit * 0.05;
    else if (jobOwner === "Personal") staffCommission = profit * 0.2;

    updated[index].staff_commission = staffCommission;
    updated[index].ashirov_profit = profit - staffCommission;

    setRows(updated);
  };

  // 💾 Save new row
  const saveRow = async (row: any) => {
    const { error } = await supabase.from("general_record").insert([row]);
    if (error) alert("Error saving: " + error.message);
    else alert("Saved successfully!");
  };

  // ❌ Delete a row
  const deleteRow = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from("general_record").delete().eq("id", id);
    if (error) alert("Delete failed: " + error.message);
    else setRows(rows.filter((r) => r.id !== id));
  };

  // ✏️ Toggle edit mode
  const toggleEdit = (index: number) => {
    const updated = [...rows];
    updated[index].editing = !updated[index].editing;
    setRows(updated);
  };

  // 💾 Update existing row
  const updateRow = async (row: any) => {
    const { id, editing, ...updateData } = row;
    const { error } = await supabase.from("general_record").update(updateData).eq("id", id);
    if (error) alert("Update failed: " + error.message);
    else {
      alert("Updated successfully!");
      const updated = rows.map((r) =>
        r.id === id ? { ...r, editing: false } : r
      );
      setRows(updated);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 text-black">
      <h2 className="text-lg font-semibold mb-4">Services Tracker</h2>

      {/* 🔍 Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Month Filter */}
        <div>
          <label className="text-sm mr-2">Month:</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded"
          >
            <option value="">All</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="text-sm mr-2">Year:</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded"
          >
            <option value="">All</option>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        {/* Customer Filter */}
        <div>
          <label className="text-sm mr-2">Customer:</label>
          <input
            type="text"
            placeholder="Enter name"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded"
          />
        </div>
      </div>

      {/* 🧮 Filtered Table */}
     <div className="overflow-x-auto overflow-y-auto max-h-[75vh] rounded-xl border border-gray-200 shadow-md bg-white">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap">
                {h}
              </th>
            ))}
            <th className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>

        

        <tbody>
          {rows
            .filter((row) => {
              const date = row.date_in ? new Date(row.date_in) : null;
              const matchesMonth =
                !filterMonth || (date && String(date.getMonth() + 1).padStart(2, "0") === filterMonth);
              const matchesYear =
                !filterYear || (date && date.getFullYear().toString() === filterYear);
              const matchesCustomer =
                !filterCustomer ||
                (row.customer_name &&
                  row.customer_name.toLowerCase().includes(filterCustomer.toLowerCase()));
              return matchesMonth && matchesYear && matchesCustomer;
            })
            .map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-blue-50 transition-colors duration-150">
                {/* Date In */}
                <td className="border-b border-gray-100 px-3 py-2">
                  <input
                    type="date"
                    value={row.date_in || ""}
                    onChange={(e) => handleInputChange(rowIndex, "date_in", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Product */}
                <td className="border border-gray-300 px-1 py-0.5 min-w-[300px]">
                  <input
                    list={`product-list-${rowIndex}`}
                    value={row.product_name || ""}
                    onChange={(e) => handleInputChange(rowIndex, "product_name", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                  <datalist id={`product-list-${rowIndex}`}>
                    {products.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </td>

                {/* Customer Name */}
                <td className="border border-gray-300 px-1 py-0.5 min-w-[200px]">
                  <input
                    type="text"
                    value={row.customer_name || ""}
                    onChange={(e) => handleInputChange(rowIndex, "customer_name", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Description */}
                <td className="border border-gray-300 px-1 py-0.5 min-w-[300px]">
                  <input
                    type="text"
                    value={row.description || ""}
                    onChange={(e) => handleInputChange(rowIndex, "description", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Qty */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    type="number"
                    value={row.quantity || ""}
                    onChange={(e) => handleInputChange(rowIndex, "quantity", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Service Charge */}
                <td className="border border-gray-300 px-1 py-0.5 text-right">
                  {row.editing ? (
                    <input
                      type="number"
                      value={row.service_charge || ""}
                      onChange={(e) =>
                        handleInputChange(rowIndex, "service_charge", e.target.value)
                      }
                      className="w-full border-none focus:outline-none text-right"
                    />
                  ) : (
                    <>₦{Number(row.service_charge || 0).toLocaleString("en-NG")}</>
                  )}
                </td>


                {/* TF */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    type="text"
                    value={row.payment_method || ""}
                    onChange={(e) => handleInputChange(rowIndex, "payment_method", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Location */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    type="text"
                    value={row.location || ""}
                    onChange={(e) => handleInputChange(rowIndex, "location", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Job Owner */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <select
                    value={row.job_owner || ""}
                    onChange={(e) => handleInputChange(rowIndex, "job_owner", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  >
                    <option value="">Select</option>
                    {jobOwnerOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Serviced By */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <select
                    value={row.serviced_by || ""}
                    onChange={(e) => handleInputChange(rowIndex, "serviced_by", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  >
                    <option value="">Select</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Expense Cost */}
                <td className="border border-gray-300 px-1 py-0.5 text-center">
                  {row.editing ? (
                    <input
                      type="number"
                      value={row.expense_cost || ""}
                      onChange={(e) =>
                        handleInputChange(rowIndex, "expense_cost", e.target.value)
                      }
                      className="w-full border-none focus:outline-none text-right"
                    />
                  ) : (
                    <>₦{Number(row.expense_cost || 0.00).toLocaleString("en-NG")}</>
                  )}
                </td>

                {/* Profit */}
                <td className="border border-gray-300 px-1 py-0.5 text-center">
                 ₦{Number(row.profit || 0.00).toLocaleString("en-NG")}
                </td>

                {/* Staff Commission */}
                <td className="border border-gray-300 px-1 py-0.5 text-center">
                  ₦{Number(row.staff_commission || 0.00).toLocaleString("en-NG")}
                </td>

                {/* Ashirov Profit */}
                <td className="border border-gray-300 px-1 py-0.5 text-center">
                  ₦{Number(row.ashirov_profit || 0.00).toLocaleString("en-NG")}
                </td>

                {/* Remark */}
                <td className="border border-gray-300 px-1 py-0.5 min-w-[200px]">
                  <select
                    value={row.remark || ""}
                    onChange={(e) => handleInputChange(rowIndex, "remark", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  >
                    <option value="">Select</option>
                    {remarkOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Date Out */}
                <td className="border border-gray-300 px-1 py-0.5">
                  <input
                    type="date"
                    value={row.date_out || ""}
                    onChange={(e) => handleInputChange(rowIndex, "date_out", e.target.value)}
                    className="w-full border-none focus:outline-none"
                  />
                </td>

                {/* Actions */}
                <td className="border border-gray-300 px-2">
                  {!row.id ? (
                    <button
                      onClick={() => saveRow(row)}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                  ) : row.editing ? (
                    <button
                      onClick={() => updateRow(row)}
                      className="bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                      Save Changes
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleEdit(rowIndex)}
                        className="bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <button
        onClick={addRow}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Row
      </button>
    </div>
    </div>
  );
}
