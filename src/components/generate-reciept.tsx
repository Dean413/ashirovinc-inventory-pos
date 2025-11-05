"use client";
import React, { useState, useMemo } from "react";
import Select from "react-select";
import ReceiptModal from "@/components/receipt-modal";

interface GenerateReceiptProps {
  sales: any[];
}

const GenerateReceipt: React.FC<GenerateReceiptProps> = ({ sales }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [date, setDate] = useState("");
  const [receiptData, setReceiptData] = useState<any>(null);

  // 🔹 Unique customer list for dropdown
  const customerOptions = useMemo(() => {
    console.log("Building customer options from sales:", sales);
    const unique = Array.from(
      new Set(sales.map((s) => s.customer_name).filter(Boolean))
    );
    const options = unique.map((name) => ({ value: name, label: name }));
    console.log("Customer dropdown options:", options);
    return options;
  }, [sales]);

  // 🔹 Date comparison helper
  const isSameDay = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handleFilter = () => {
    console.log("➡️ handleFilter called");
    console.log("Selected customer:", selectedCustomer);
    console.log("Selected date:", date);

    if (!selectedCustomer) {
      alert("Please select a customer");
      console.warn("⚠️ No customer selected");
      return;
    }

    // Filter all sales for that customer & date
    const filteredSales = sales.filter(
      (sale) =>
        sale.customer_name === selectedCustomer.value &&
        (!date || isSameDay(sale.date, date))
    );

    console.log("Filtered sales:", filteredSales);

    if (filteredSales.length === 0) {
      alert("No matching sales found for that customer/date.");
      console.warn("⚠️ No sales matched for filter.");
      return;
    }

    // 🔹 Combine all items into one receipt
    const combinedItems = filteredSales.flatMap((s) => s.sale_items || []);
    const subtotal = filteredSales.reduce(
      (acc, s) => acc + Number(s.subtotal || 0),
      0
    );
    const discount = filteredSales.reduce(
      (acc, s) => acc + Number(s.discount || 0),
      0
    );
    const total = filteredSales.reduce(
      (acc, s) => acc + Number(s.total || 0),
      0
    );

    const combined = {
  customer: selectedCustomer.value,
  seller: filteredSales[0].merchant_name,
  date: date || filteredSales[0].date,
  items: filteredSales.flatMap((s) =>
    (s.sale_items || []).map((i:any) => ({
      name: i.product_name,
      price: Number(i.unit_price),
      quantity: Number(i.quantity),
    }))
  ),
  subtotal: filteredSales.reduce(
    (acc, s) => acc + Number(s.subtotal || 0),
    0
  ),
  discount: filteredSales.reduce(
    (acc, s) => acc + Number(s.discount || 0),
    0
  ),
  total: filteredSales.reduce(
    (acc, s) => acc + Number(s.total || 0),
    0
  ),
};

    console.log("✅ Combined receipt data ready:", combined);

    setReceiptData(combined);
    setShowFilterModal(false);
    setShowReceipt(true);
  };

  return (
    <>
      {/* 🔹 Generate Receipt Button */}
      <button
        onClick={() => {
          console.log("🧾 Opening filter modal...");
          setShowFilterModal(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Generate Receipt
      </button>

      {/* 🔹 Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Generate Receipt</h3>

            <label className="block mb-2 text-sm font-medium">Customer</label>
            <Select
              options={customerOptions}
              value={selectedCustomer}
              onChange={(val) => {
                console.log("🧍 Selected customer:", val);
                setSelectedCustomer(val);
              }}
              placeholder="Search or select customer..."
              isClearable
              isSearchable
              className="mb-4"
            />

            <label className="block mb-2 text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                console.log("📅 Selected date:", e.target.value);
                setDate(e.target.value);
              }}
              className="border rounded-md w-full p-2 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  console.log("❌ Cancel clicked, closing modal");
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Receipt Modal */}
      {showReceipt && receiptData && (
        <ReceiptModal
          receipt={receiptData} // ✅ changed from sale → receipt
          onClose={() => {
            console.log("🧾 Closing receipt modal");
            setShowReceipt(false);
          }}
        />
      )}
    </>
  );
};

export default GenerateReceipt;
