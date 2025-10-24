"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseclient";

export default function CustomerModal({ onClose, onCustomerAdded }: any) {
  const [name, setName] = useState("");
  const [phone_number, setPhone_number] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return alert("Customer name is required");
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .insert([{ name, phone_number }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Failed to save customer: " + error.message);
    } else {
      onCustomerAdded(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[320px] text-black shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add New Customer</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={phone_number}
              onChange={(e) => setPhone_number(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MerchantModal({ onClose, onMerchantAdded }: any) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return alert("Merchant name is required");
    setLoading(true);

    const { data, error } = await supabase
      .from("merchants")
      .insert([{ name, }])
      .select()
      .single();

    setLoading(false);

    if (error) {
      alert("Failed to save merchant: " + error.message);
    } else {
      onMerchantAdded(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[320px] text-black shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add new Merchant</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Merchant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Enter Merchant name"
            />
          </div>
          
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
