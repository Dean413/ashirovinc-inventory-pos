"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import Select from "react-select"
import FullPageLoader from "@/components/page-reloader";
import { useQuery } from "@tanstack/react-query";
import { FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

interface Record {
  id: number;
  customer_name: string;
  quantity: number;
  service_charge: number;
  description: string;
  date_in: string;
  product_name: string;
  category: string;
}

interface Payment {
  id: number;
  vendor_name: string;
  amount: number;
  type: "sent" | "received";
  description?: string;
  date: string;
}

export default function VendorsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [paymentForm, setPaymentForm] = useState({amount: "", type: "sent", description: "",});
  const [summary, setSummary] = useState({totalGoodsInQty: 0, totalGoodsOutQty: 0, totalCredit: 0, totalDebit: 0, totalSent: 0, totalReceived: 0, balance: 0,});


  // Fetch all vendor goods using React Query
  const {data: records = [], isLoading: recordsLoading, error: recordsError, refetch: recordsRefetch, isFetching: recordsIsFetching,} = useQuery<Record[]>({
    queryKey: ["general_record"], 
    queryFn: async () => {
      const { data, error } = await supabase.from("general_record") .select("id, customer_name, quantity, service_charge, description, date_in, product_name, category")
        .or("description.ilike.%GOODS IN%,description.ilike.%GOODS OUT%").order("id", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Fetch all vendor payments using React Query
  const {data: paymentsData = [], refetch: paymentsRefetch} = useQuery<Payment[]>({
    queryKey: ["vendor_payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_payments").select("*").order("id", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Add or Update Payment
  const handleAddOrUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendor || !paymentForm.amount) {
      toast.error("Please select a vendor and enter amount.");
      return;
    }

    setLoading(true); // start loading

    try {
      if (editingPayment) {
        // Update existing payment
        const { error } = await supabase.from("vendor_payments").update({
          amount: Number(paymentForm.amount),
          type: paymentForm.type,
          description: paymentForm.description,
        }) .eq("id", editingPayment.id);

        if (error) throw new Error(error.message);

        toast.success("Payment updated successfully!");
        paymentsRefetch();
        setEditingPayment(null);
        setPaymentForm({ amount: "", type: "sent", description: "" });
      } 
      else {
        // Add new payment
        const { error } = await supabase.from("vendor_payments").insert([
          {
            vendor_name: selectedVendor,
            amount: Number(paymentForm.amount),
            type: paymentForm.type,
            description: paymentForm.description,
          },
        ]);

        if (error) throw new Error(error.message);

        toast.success("Payment added successfully!");
        paymentsRefetch();
        setPaymentForm({ amount: "", type: "sent", description: "" });
      }
    } catch (err: any) {
    toast.error("Error saving payment: " + err.message);
    } finally {
    setLoading(false); // stop loading
    }
  };
  paymentsRefetch();

  

  // Filter by vendor
  const uniqueVendors = Array.from(new Set(records.map((r) => r.customer_name))).filter(Boolean);
  const uniqueCategories = Array.from(new Set(records.map((r) => r.category))).filter(Boolean);

// Extract unique months from all records (for dropdown)
const uniqueMonths = Array.from(
  new Set(
    records
      .filter((r) => r.date_in) // make sure date exists
      .map((r) => new Date(r.date_in || "").toLocaleString("default", { month: "long", year: "numeric" }))
  )
);

const filteredRecords = records.filter((r) => {
  const matchVendor = selectedVendor
    ? r.customer_name?.toLowerCase() === selectedVendor.toLowerCase()
    : true;

  const matchCategory = selectedCategory
    ? r.category?.toLowerCase() === selectedCategory.toLowerCase()
    : true;

  const matchMonth = selectedMonth
    ? new Date(r.date_in || "").toLocaleString("default", { month: "long", year: "numeric" }) === selectedMonth
    : true;

  return matchVendor && matchCategory && matchMonth;
});


  // Separate GOODS IN and GOODS OUT
  const goodsIn = filteredRecords.filter((r) => r.description?.toUpperCase().includes("GOODS IN"));
  const goodsOut = filteredRecords.filter((r) => r.description?.toUpperCase().includes("GOODS OUT"));

  // Filter payments by selected vendor
  const filteredPayments = selectedVendor ? paymentsData.filter((p) => p.vendor_name?.toLowerCase() === selectedVendor.toLowerCase()) : paymentsData;

  useEffect(() => {
    const totalGoodsInQty = goodsIn.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalGoodsOutQty = goodsOut.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const totalDebit = goodsIn.reduce((sum, r) => sum + (r.quantity * (r.service_charge || 0)), 0);
    const totalCredit = goodsOut.reduce((sum, r) => sum + (r.quantity * (r.service_charge || 0)), 0);

    // calculate total money sent & received for this vendor
    const vendorPayments = paymentsData.filter((p) => !selectedVendor || p.vendor_name?.toLowerCase() === selectedVendor.toLowerCase());
    const totalSent = vendorPayments.filter((p) => p.type === "sent").reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalReceived = vendorPayments
    .filter((p) => p.type === "received")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    const balance = totalCredit - totalReceived;

    // only update state if the computed values are different
    setSummary((prev) => {
      const newSummary = {totalGoodsInQty, totalGoodsOutQty, totalCredit, totalDebit, totalSent, totalReceived, balance,};
      
      // avoid infinite loop by checking if the summary actually changed
      if (JSON.stringify(prev) !== JSON.stringify(newSummary)) {
        return newSummary;
     }
      return prev;
    });
  }, [goodsIn, goodsOut, paymentsData, selectedVendor]);

  // Edit Payment
  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      amount: payment.amount.toString(),
      type: payment.type,
      description: payment.description || "",
    });
  };

  // Delete Payment
  const handleDeletePayment = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this payment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("vendor_payments").delete().eq("id", id);

      if (error) {
      toast.error("Failed to delete payment: " + error.message);
      } else {
        toast.success("Payment has been deleted");
        paymentsRefetch(); // refresh list
      }
    }
  };

  if (recordsLoading) return <FullPageLoader text="Loading sales data..." />;

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-4">
        {/* Refresh icon */}
        <button onClick={() => recordsRefetch()} className="text-blue-600 hover:text-blue-800" title="Refresh">
          <FiRefreshCw className={`w-6 h-6 transition-transform duration-500 ${recordsIsFetching ? "animate-spin" : ""}`}/>
        </button>
      </div>
      <h1 className="text-2xl font-semibold mb-6">Vendor Transactions Dashboard</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Vendor select */}
        <div className="w-full md:w-1/2">
          <label className="text-sm font-medium block mb-2">Select Vendor:</label>
          <Select isClearable isSearchable
            placeholder="Select a Vendor"
            value={selectedVendor ? { value: selectedVendor, label: selectedVendor } : null}
            onChange={(option: any) => setSelectedVendor(option ? option.value : "")}
            options={uniqueVendors.map((vendor) => ({ value: vendor, label: vendor }))}
            classNamePrefix="react-select"
          />
        </div>

        {/* Category select */}
        <div className="w-full md:w-1/2">
          <label className="text-sm font-medium block mb-2">Select Category:</label>
          <Select isClearable isSearchable
            placeholder="Select a Category"
            value={selectedCategory ? { value: selectedCategory, label: selectedCategory } : null}
            onChange={(option: any) => setSelectedCategory(option ? option.value : "")}
            options={uniqueCategories.map((cat) => ({ value: cat, label: cat }))}
            classNamePrefix="react-select"
          />
        </div>

        <div className="w-full md:w-1/2">
          <label className="text-sm font-medium block mb-2">Select Month:</label>
          <Select
            isClearable
            isSearchable
            placeholder="Select a Month"
            value={selectedMonth ? { value: selectedMonth, label: selectedMonth } : null}
            onChange={(option: any) => setSelectedMonth(option ? option.value : "")}
            options={uniqueMonths.map((month) => ({ value: month, label: month }))}
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Goods In (Qty)</h3>
          <p className="text-lg font-semibold">{summary.totalGoodsInQty}</p>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Goods Out (Qty)</h3>
          <p className="text-lg font-semibold">{summary.totalGoodsOutQty}</p>
        </div>
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Debit (₦)</h3>
          <p className="text-lg font-semibold"> ₦{summary.totalDebit.toLocaleString("en-NG")}</p>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Credit (₦)</h3>
          <p className="text-lg font-semibold">₦{summary.totalCredit.toLocaleString("en-NG")}</p>
        </div>
        <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Money Sent (₦)</h3>
          <p className="text-lg font-semibold">₦{summary.totalSent.toLocaleString("en-NG")}</p>
        </div>
        <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Money Recieved (₦)</h3>
          <p className="text-lg font-semibold"> ₦{summary.totalReceived.toLocaleString("en-NG")}</p>
        </div>

        {/* Net Balance */}
        <div className={`${summary.totalCredit - summary.totalDebit >= 0? "bg-green-200 border-green-500": "bg-red-200 border-red-500"} border-l-4 p-4 rounded-lg shadow-sm`}>
          <h3 className="text-sm text-gray-700">Net Balance (₦)</h3>
          <p className="text-lg font-semibold">
            ₦{(() => {
              const { totalCredit, totalDebit, totalSent, totalReceived } = summary;
              const hasSelectedVendor = !!selectedVendor;
              const hasSelectedMonth = !!selectedMonth;
              const hasSelectedCategory = !!selectedCategory;

              if (hasSelectedCategory || hasSelectedMonth) {
                return null
              }

              if (hasSelectedVendor && totalSent > 0 && totalReceived > 0) {
                // both sent & received exist for selected vendor
                return (totalCredit - totalDebit + (totalSent - totalReceived)).toLocaleString("en-NG");
              }

              if (hasSelectedVendor && totalSent > 0) {
                return (totalCredit - totalDebit + totalSent).toLocaleString("en-NG");
              }

              if (hasSelectedVendor && totalReceived > 0) {
                return (totalCredit - totalDebit - totalReceived).toLocaleString("en-NG");
              }

              // fallback: either no vendor selected or totals are 0
              return (totalCredit - totalDebit + (totalSent - totalReceived)).toLocaleString("en-NG");
            })()}
          </p>
        </div>
      </div>

      {/* Payment Form */}
      {selectedVendor && (
        <form onSubmit={handleAddOrUpdatePayment} className="bg-gray-50 border border-gray-300 p-4 rounded-lg mb-8">
          <h3 className="font-semibold mb-2">Record Payment for {selectedVendor}</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-1/4"
              type="number"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
            <select className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-1/4"
              value={paymentForm.type}
              onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value as "sent" | "received",})}>
              <option value="sent">Money Sent</option>
              <option value="received">Money Received</option>
            </select>
            <input className="border border-gray-300 px-3 py-2 rounded-md w-full md:flex-1"
              type="text"
              placeholder="Description"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
            />

            <button onClick={handleAddOrUpdatePayment} disabled={loading}  className={`btn ${loading ? "opacity-50 cursor-not-allowed" : ""} bg-blue-700 text-white px-4 py-2 rounded-md`}>
              {loading ? "Saving..." : editingPayment ? "Update Payment" : "Add Payment"}
            </button>
          </div>
        </form>
      )}

      {/* GOODS IN & OUT Tables Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GOODS IN Table */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-green-700">Goods In</h2>
          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Product</th>
                     <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Vendor</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Cost (₦)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Total (₦)</th>
                </tr>
              </thead>
              <tbody>
                {goodsIn.length > 0 ? (
                  goodsIn.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.date_in}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.product_name}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.category}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.customer_name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        ₦{Number(item.service_charge || 0).toLocaleString("en-NG")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        ₦{Number(item.quantity * item.service_charge || 0).toLocaleString("en-NG")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-3">
                      No “Goods In” records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* GOODS OUT Table */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-red-700">Goods Out</h2>
          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Product</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Vendor</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Cost (₦)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Total (₦)</th>
                </tr>
              </thead>
              <tbody>
                {goodsOut.length > 0 ? (
                  goodsOut.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.date_in}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.product_name}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.category}</td>
                      <td className="border border-gray-300 px-3 py-2 wrap-break-word">{item.customer_name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        ₦{Number(item.service_charge || 0).toLocaleString("en-NG")}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        ₦{Number(item.quantity * item.service_charge || 0).toLocaleString("en-NG")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-3">
                      No “Goods Out” records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Payment History */}
      {filteredPayments.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-3 text-blue-700">
            Payment History {selectedVendor && `for ${selectedVendor}`}
          </h2>
          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Vendor</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount (₦)</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{p.date}</td>
                    <td className={`border border-gray-300 px-3 py-2 ${p.type === "sent" ? "text-red-600" : "text-green-600"}`}>{p.type === "sent" ? "Money Sent" : "Money Received"}</td>
                    <td className="border border-gray-300 px-3 py-2">{p.vendor_name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right"> ₦{p.amount.toLocaleString("en-NG")} </td>
                    <td className="border border-gray-300 px-3 py-2">{p.description || "-"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button onClick={() => handleEditPayment(p)}  className="text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDeletePayment(p.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
