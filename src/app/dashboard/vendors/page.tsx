"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import Select from "react-select"
import FullPageLoader from "@/components/page-reloader";

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
  const [records, setRecords] = useState<Record[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "sent",
    description: "",
  });

  // Totals
  const [summary, setSummary] = useState({
    totalGoodsInQty: 0,
    totalGoodsOutQty: 0,
    totalCredit: 0,
    totalDebit: 0,
    totalSent: 0,
    totalReceived: 0,
    balance: 0,
  });

  // Fetch all vendor goods
  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("general_record")
      .select(
        "id, customer_name, quantity, service_charge, description, date_in, product_name, category"
      )
      .or("description.ilike.%GOODS IN%,description.ilike.%GOODS OUT%")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching records:", error.message);
      setLoading(false);
      return;
    }

    setRecords(data as Record[]);
    setLoading(false);
  };

  useEffect(() => {
    const fetchVendor = async () => {
      const { data, error } = await supabase.from("general_record").select("id, customer_name");
      if (error) console.error(error);
      else {
        setVendorOptions(
          data.map((c) => ({
            value: c.id,
            label: c.customer_name,
          }))
        );
      }
    };
    fetchVendor();
  }, []); 

  // Fetch vendor payments
  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("vendor_payments")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching payments:", error.message);
      return;
    }

    setPayments(data as Payment[]);
  };

  // Add a new payment
  const handleAddOrUpdatePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedVendor || !paymentForm.amount) {
    alert("Please select a vendor and enter amount.");
    return;
  }

  if (editingPayment) {
    // 🟩 Update existing payment
    const { error } = await supabase
      .from("vendor_payments")
      .update({
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        description: paymentForm.description,
      })
      .eq("id", editingPayment.id);

    if (error) {
      alert("Error updating payment: " + error.message);
    } else {
      alert("Payment updated successfully!");
      fetchPayments();
      setEditingPayment(null);
      setPaymentForm({ amount: "", type: "sent", description: "" });
    }
  } else {
    // 🟦 Add new payment
    const { error } = await supabase.from("vendor_payments").insert([
      {
        vendor_name: selectedVendor,
        amount: Number(paymentForm.amount),
        type: paymentForm.type,
        description: paymentForm.description,
      },
    ]);

    if (error) {
      alert("Error adding payment: " + error.message);
    } else {
      fetchPayments();
      setPaymentForm({ amount: "", type: "sent", description: "" });
    }
  }
};


  useEffect(() => {
    fetchVendors();
    fetchPayments();
  }, []);

  // Filter by vendor
  const uniqueVendors = Array.from(
    new Set(records.map((r) => r.customer_name))
  ).filter(Boolean);

  const uniqueCategories = Array.from(
  new Set(records.map((r) => r.category))
).filter(Boolean);

  const filteredRecords = records.filter((r) => {
  const matchVendor = selectedVendor
    ? r.customer_name?.toLowerCase() === selectedVendor.toLowerCase()
    : true;

  const matchCategory = selectedCategory
    ? r.category?.toLowerCase() === selectedCategory.toLowerCase()
    : true;

  return matchVendor && matchCategory;
});


  const goodsIn = filteredRecords.filter((r) =>
    r.description?.toUpperCase().includes("GOODS IN")
  );
  const goodsOut = filteredRecords.filter((r) =>
    r.description?.toUpperCase().includes("GOODS OUT")
  );

  const filteredPayments = selectedVendor
    ? payments.filter(
        (p) => p.vendor_name?.toLowerCase() === selectedVendor.toLowerCase()
      )
    : payments;

  useEffect(() => {
  const totalGoodsInQty = goodsIn.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalGoodsOutQty = goodsOut.reduce((sum, r) => sum + (r.quantity || 0), 0);

  const totalDebit = goodsIn.reduce(
    (sum, r) => sum + (r.quantity * (r.service_charge || 0)),
    0
  );
  const totalCredit = goodsOut.reduce(
    (sum, r) => sum + (r.quantity * (r.service_charge || 0)),
    0
  );

  // calculate total money sent & received for this vendor
  const vendorPayments = payments.filter(
    (p) =>
      !selectedVendor ||
      p.vendor_name?.toLowerCase() === selectedVendor.toLowerCase()
  );

  const totalSent = vendorPayments
    .filter((p) => p.type === "sent")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalReceived = vendorPayments
    .filter((p) => p.type === "received")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const balance = totalCredit - totalReceived;


  // only update state if the computed values are different
  setSummary((prev) => {
    const newSummary = {
      totalGoodsInQty,
      totalGoodsOutQty,
      totalCredit,
      totalDebit,
      totalSent,
      totalReceived,
      balance,
    };

    // avoid infinite loop by checking if the summary actually changed
    if (JSON.stringify(prev) !== JSON.stringify(newSummary)) {
      return newSummary;
    }
    return prev;
  });
}, [goodsIn, goodsOut, payments, selectedVendor]);



const handleEditPayment = (payment: Payment) => {
  setEditingPayment(payment);
  setPaymentForm({
    amount: payment.amount.toString(),
    type: payment.type,
    description: payment.description || "",
  });
};

const handleDeletePayment = async (id: number) => {
  if (!confirm("Are you sure you want to delete this payment?")) return;

  const { error } = await supabase.from("vendor_payments").delete().eq("id", id);
  if (error) alert("Error deleting payment: " + error.message);
  else fetchPayments();
};




  if (loading) return <FullPageLoader text="Loading sales data..." />;

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-semibold mb-6">Vendor Transactions Dashboard</h1>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
  {/* Vendor select */}
  <div className="w-full md:w-1/2">
    <label className="text-sm font-medium block mb-2">Select Vendor:</label>
    <Select
      isClearable
      isSearchable
      placeholder="Select a Vendor"
      value={
        selectedVendor
          ? { value: selectedVendor, label: selectedVendor }
          : null
      }
      onChange={(option: any) => setSelectedVendor(option ? option.value : "")}
      options={uniqueVendors.map((vendor) => ({
        value: vendor,
        label: vendor,
      }))}
      classNamePrefix="react-select"
    />
  </div>

  {/* Category select */}
  <div className="w-full md:w-1/2">
    <label className="text-sm font-medium block mb-2">Select Category:</label>
    <Select
      isClearable
      isSearchable
      placeholder="Select a Category"
      value={
        selectedCategory
          ? { value: selectedCategory, label: selectedCategory }
          : null
      }
      onChange={(option: any) =>
        setSelectedCategory(option ? option.value : "")
      }
      options={uniqueCategories.map((cat) => ({
        value: cat,
        label: cat,
      }))}
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
          <p className="text-lg font-semibold">
            ₦{summary.totalDebit.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Credit (₦)</h3>
          <p className="text-lg font-semibold">
            ₦{summary.totalCredit.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Money Sent (₦)</h3>
          <p className="text-lg font-semibold">
            ₦{summary.totalSent.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg shadow-sm">
          <h3 className="text-sm text-gray-700">Money Recieved (₦)</h3>
          <p className="text-lg font-semibold">
            ₦{summary.totalReceived.toLocaleString("en-NG")}
          </p>
        </div>
        <div
          className={`${
            summary.totalCredit - summary.totalDebit >= 0
              ? "bg-green-200 border-green-500"
              : "bg-red-200 border-red-500"
          } border-l-4 p-4 rounded-lg shadow-sm`}
        >
          <h3 className="text-sm text-gray-700">Net Balance (₦)</h3>
          <p className="text-lg font-semibold">
                {summary.totalSent > 0 ? (
            <>
                ₦{(summary.totalSent + (summary.totalCredit - summary.totalDebit)).toLocaleString("en-NG")}
            </>
            ) : summary.totalReceived > 0 ? (
                <span>
                ₦{(summary.totalCredit - summary.totalReceived).toLocaleString("en-NG")}
                </span>
            )
            
            
            : (
             <span>
                ₦{(summary.totalCredit - summary.totalDebit).toLocaleString("en-NG")}
            </span>
            )}
            </p>

        </div>
      </div>

      {/* Payment Form */}
      {selectedVendor && (
        <form
          onSubmit={handleAddOrUpdatePayment}
          className="bg-gray-50 border border-gray-300 p-4 rounded-lg mb-8"
        >
          <h3 className="font-semibold mb-2">Record Payment for {selectedVendor}</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="number"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, amount: e.target.value })
              }
              className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-1/4"
            />
            <select
              value={paymentForm.type}
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  type: e.target.value as "sent" | "received",
                })
              }
              className="border border-gray-300 px-3 py-2 rounded-md w-full md:w-1/4"
            >
              <option value="sent">Money Sent</option>
              <option value="received">Money Received</option>
            </select>
            <input
              type="text"
              placeholder="Description"
              value={paymentForm.description}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, description: e.target.value })
              }
              className="border border-gray-300 px-3 py-2 rounded-md w-full md:flex-1"
            />
           <button
  type="submit"
  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
>
  {editingPayment ? "Update Payment" : "Add Payment"}
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
            <th className="border border-gray-300 px-3 py-2 text-right">Amount (₦)</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">{p.date}</td>
              <td
                className={`border border-gray-300 px-3 py-2 ${
                  p.type === "sent" ? "text-red-600" : "text-green-600"
                }`}
              >
                {p.type === "sent" ? "Money Sent" : "Money Received"}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right">
                ₦{p.amount.toLocaleString("en-NG")}
              </td>
              <td className="border border-gray-300 px-3 py-2">{p.description || "-"}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">
                <button
                  onClick={() => handleEditPayment(p)}
                  className="text-blue-600 hover:underline mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePayment(p.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
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
