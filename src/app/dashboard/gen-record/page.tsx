"use client";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseclient";
import { supaBase } from "@/lib/supabaseclient";
import Select from "react-select"
import FullPageLoader from "@/components/page-reloader";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiRefreshCcw as Fi, FiRefreshCw } from "react-icons/fi";
 


export default function ServicesSpreadsheet() {
  const queryClient = useQueryClient();
  const headers = [
    "Date In",
    "Product",
    "Category",
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
  const [filterDay, setFilterDay] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);


  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["general-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("general_record")
        .select("*")
        .order("id");

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
    gcTime: 1000 * 60 * 30, // 30 mins
  });

  // ✅ Sync data to local state
  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  // ✅ Handle errors
  useEffect(() => {
    if (error) toast.error("Error fetching records: " + error.message);
  }, [error]);

  const uniqueCustomers = Array.from(
    new Set(rows.map((row) => row.customer_name).filter(Boolean))
  );

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


  const saveRow = useMutation({
    mutationFn: async (row: any) => {
      const { editing, backupRow, ...cleanData } = row;
      const { error } = await supabase.from("general_record").insert([cleanData]);
      if (error) throw error;
      return cleanData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["general_record"] });
      toast.success("Saved successfully!");
      refetch();
      setSavingId(null);
    },
    onError: (err: any) => {
      toast.error("Error saving: " + err.message);
      setSavingId(null);
    },
  });

  const handleDelete = async (id: string) => {
  const result = await Swal.fire({
    title: "Delete this record?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    setLoadingId(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("general_record").delete().eq("id", id);
    if (error) throw error;
    toast.success("Record deleted successfully!");
    queryClient.invalidateQueries({ queryKey: ["general_record"], refetchType: "all" });
  } catch (err: any) {
    toast.error("Delete failed: " + err.message);
  } finally {
    setLoadingId(null);
  }
};


  // ✏️ Toggle edit mode
  const toggleEdit = (index:any, editing = true) => {
    setRows((prevRows) =>
      prevRows.map((row, i) => {
        if (i === index) {
          if (editing) {
            // Start editing → backup current data
            return { ...row, editing: true, backupRow: { ...row } };
          } else {
            // Cancel editing → restore old data
            return { ...row.backupRow, editing: false, backupRow: undefined };
          }
        }
        return row;
      })
    );
  };

 // 🟡 Update existing row
  const updateRow = async (row: any) => {
  // Remove temporary fields
  const { id, editing, backupRow, ...updateData } = row;
  const { error } = await supabase
    .from("general_record")
    .update(updateData)
    .eq("id", id);

  if (error) toast.error("Update failed: " + error.message);
    else {
      toast.success("Updated successfully!");
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, editing: false, backupRow: undefined } : r
        )
      );
    }
  };

  const dynamicTitle = useMemo(() => {
    let title = "General Record";

    // If both month & year are selected
    if (filterMonth && filterYear) {
      const monthName = new Date(0, parseInt(filterMonth) - 1).toLocaleString("default", { month: "long" });
      title = `General Record for ${monthName} ${filterYear}`;
    }
    // If only month is selected
    else if (filterMonth) {
      const monthName = new Date(0, parseInt(filterMonth) - 1).toLocaleString("default", { month: "long" });
      title = `General Record for ${monthName}`;
    }
    // If only year is selected
    else if (filterYear) {
      title = `General Record for ${filterYear}`;
    }

    return title;
  }, [filterMonth, filterYear]);

  

  if (isLoading) return <FullPageLoader text="Loading..." />
  
  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        {/* Refresh icon */}
        <button
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-800"
          title="Refresh"
        >
          <FiRefreshCw
            className={`w-6 h-6 transition-transform duration-500 ${
              isFetching ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
      
      <h2 className="text-lg font-semibold mb-4">{dynamicTitle}</h2>

      {/* 🔍 Filter Controls */}
      <div className="mb-6 z-50">
        <div className="flex flex-wrap gap-4 mb-6 z-50">
          {/* Month Filter */}
          <div className="w-full md:w-[250px] z-50">
            <label className="text-sm font-medium block mb-2">Month:</label>
            <Select
              isClearable
              placeholder="Select Month"
              value={filterMonth ? 
                {value: filterMonth, label: new Date(0, parseInt(filterMonth) - 1).toLocaleString("default", { month: "long" } ),}: null}
                onChange={(option) => setFilterMonth(option ? option.value : "")}
                options={[...Array(12)].map((_, i) => ({
                value: String(i + 1).padStart(2, "0"),
                label: new Date(0, i).toLocaleString("default", { month: "long" }),
              }))}
              classNamePrefix="react-select"
            />
          </div>

          {/* Year Filter */}
          <div className="w-full md:w-[200px] z-50">
            <label className="text-sm font-medium block mb-2">Year:</label>
            <Select
              isClearable
              placeholder="Select Year"
              value={filterYear ? 
                { value: filterYear, label: filterYear } : null}
                onChange={(option) => setFilterYear(option ? option.value : "")}
                options={Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: String(year), label: String(year) };
              })}
              classNamePrefix="react-select"
            />
          </div>

          {/* Day Filter */}
          <div className="w-full md:w-[200px] z-50">
            <label className="text-sm font-medium block mb-2">Day:</label>
            <Select
              isClearable
              placeholder="Select Day"
              value={filterDay ? 
                { value: filterDay, label: filterDay } : null}
                onChange={(option) => setFilterDay(option ? option.value : "")}
                options={Array.from({ length: 31 }, (_, i) => ({
                value: String(i + 1).padStart(2, "0"),
                label: String(i + 1),
              }))}
              classNamePrefix="react-select"
            />
          </div>

          {/* Customer Filter */}
          <div className="w-full md:w-[300px] z-50"> 
            <label className="text-sm font-medium block mb-2">Customer:</label>
            <Select
              isClearable
              isSearchable
              placeholder="Select or search customer"
              value={filterCustomer? { value: filterCustomer, label: filterCustomer } : null}
              onChange={(option) => setFilterCustomer(option ? option.value : "")}
              options={uniqueCustomers.map((customer) => ({
                value: customer,
                label: customer,
              }))}
              classNamePrefix="react-select"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-[250px] z-50">
            <label className="text-sm font-medium block mb-2">Category:</label>
            <Select
              isClearable
              placeholder="Select Category"
              value={filterCategory ? 
                { value: filterCategory, label: filterCategory }: null}
                onChange={(option) => setFilterCategory(option ? option.value : "")}
                options={[
                  { value: "Laptop", label: "Laptop" },
                  { value: "Accessories", label: "Accessories" },
                  { value: "Phones", label: "Phones" },
                  { value: "Others", label: "Others" },
                ]}
              classNamePrefix="react-select"
            />
          </div>
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
            {rows.map
            ((row, rowIndex) => ({ row, rowIndex })).filter(({ row }) => {
              const date = row.date_in ? new Date(row.date_in) : null;
              const matchesMonth = !filterMonth || (date && String(date.getMonth() + 1).padStart(2, "0") === filterMonth);
              const matchesYear = !filterYear || (date && date.getFullYear().toString() === filterYear);
              const matchesDay = !filterDay || (date && String(date.getDate()).padStart(2, "0") === filterDay);
              const matchesCustomer = !filterCustomer || (row.customer_name && row.customer_name.toLowerCase().includes(filterCustomer.toLowerCase()));
              const matchesCategory = !filterCategory || (row.category && row.category.toLowerCase().includes(filterCategory.toLowerCase()));
              return matchesMonth && matchesYear && matchesDay && matchesCustomer && matchesCategory;
            }).map(({ row, rowIndex }) => (
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
              {/* Category */}
              <td className="border border-gray-300 px-1 py-0.5 min-w-[150px]">
                <select
                  value={row.category || ""}
                  onChange={(e) => handleInputChange(rowIndex, "category", e.target.value)}
                  className="w-full border-none focus:outline-none bg-transparent">
                  <option value="">Select Category</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Phones">Phones</option>
                  <option value="Others">Others</option>
                </select>
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
                    onChange={(e) => handleInputChange(rowIndex, "service_charge", e.target.value)}
                    className="w-full border-none focus:outline-none text-right"
                  />
                  ) : (<>₦{Number(row.service_charge || 0).toLocaleString("en-NG")}</>)
                }
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
                  className="w-full border-none focus:outline-none">
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
                  className="w-full border-none focus:outline-none">
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
                    onChange={(e) => handleInputChange(rowIndex, "expense_cost", e.target.value)}
                    className="w-full border-none focus:outline-none text-right"
                  />
                  ) : (<>₦{Number(row.expense_cost || 0.00).toLocaleString("en-NG")}</>)}
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
                  className="w-full border-none focus:outline-none">
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
                  <button onClick={() => { saveRow.mutate(row); setSavingId(row.id); }} disabled={savingId === row.id} className={`px-2 py-1 rounded text-white ${saveRow.status === "pending" ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                    {saveRow.status === "pending" ? "Saving..." : "Save"}
                  </button>
                ) 
                :
                row.editing ? (
                  <div className="flex gap-2">
                    <button onClick={() => updateRow(row)} className="bg-yellow-600 text-white px-2 py-1 rounded">
                      Save Changes
                    </button>
                    
                    <button onClick={() => toggleEdit(rowIndex, false)} className="bg-gray-500 text-white px-2 py-1 rounded">
                      Cancel
                    </button>
                  </div>
                ) 
                : 
                (
                  <div className="flex gap-2">
                    <button onClick={() => toggleEdit(rowIndex, true)} className="bg-blue-600 text-white px-2 py-1 rounded">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(row.id)} disabled={loadingId === row.id} className={`bg-red-600 text-white px-2 py-1 rounded ${loadingId === row.id ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}>
                      {loadingId === row.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addRow}className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Add Row
        </button>
      </div>
    </div>
  );
}
