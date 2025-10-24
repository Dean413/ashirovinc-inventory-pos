"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ReceiptModal from "@/components/receipt-modal";
import { supabase, supaBase } from "@/lib/supabaseclient";
import CustomerModal from "@/components/customer-modal";
import { MerchantModal } from "@/components/customer-modal";

const Select = dynamic(() => import("react-select"), { ssr: false });
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });




interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

type Toast = { message: string; type: "success" | "error" };



export default function Dashboard() {
const [loading, setLoading] = useState(false);
const [showAddCustomer, setShowAddCustomer] = useState(false);
const [showAddMerchant, setShowAddMerchant] = useState(false);
const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);
const [merchantOptions, setMerchantOptions] = useState<{ value: string; label: string }[]>([]);
const [customers, setCustomer] = useState<{ label: string; value: string } | null>(null);
const [merchant, setMerchant] = useState<{ label: string; value: string } | null>(null);
const [discount, setDiscount] = useState<number>(0);
const [receipt, setReceipt] = useState<any | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [cart, setCart] = useState<CartItem[]>([]);
const [toast, setToast] = useState<Toast | null>(null);
const [productInput, setProductInput] = useState<string>("");

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supaBase.from("products").select("*");
      if (data && !error) setProducts(data as Product[]);
    };
    fetchProducts();
  }, []);

  // Fetch customers from Supabase
useEffect(() => {
  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("id, name, phone_number");
    if (error) console.error(error);
    else {
      setCustomerOptions(
        data.map((c) => ({
          value: c.id,
          label: `${c.name}${c.phone_number ? ` (${c.phone_number})` : ""}`,
        }))
      );
    }
  };
  fetchCustomers();
}, [showAddCustomer]); // refetch when modal closes

useEffect(() => {
  const fetchMerchant = async () => {
    const { data, error } = await supabase.from("merchants").select("id, name");
    if (error) console.error(error);
    else {
      setMerchantOptions(
        data.map((c) => ({
          value: c.id,
          label: c.name,
        }))
      );
    }
  };
  fetchMerchant();
}, [showAddMerchant]); // refetch when modal closes


  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectProduct = (selected: any) => {
    if (!selected) return;
    const found = products.find((p) => p.id === selected.value);
    if (!found) return;
    if (cart.some((item) => item.id === found.id)) {
      showToast("Product already added", "error");
      return;
    }
    setCart([...cart, { ...found, quantity: 1 }]);
    showToast(`${found.name} added`, "success");
    setProductInput(""); // clears the input display
  };

  const handleQuantityChange = (id: number, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const safeQty = Math.min(Math.max(1, newQty), item.stock);
          if (newQty > item.stock) {
            showToast(`Only ${item.stock} in stock`, "error");
          }
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  };

  const filterProducts = (inputValue: string) => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const loadOptions = (inputValue: string, callback: any) => {
    const filtered = filterProducts(inputValue);
    callback(
      filtered.map((p) => ({
        value: p.id,
        label: (
          <div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">
              ₦{p.price.toLocaleString()} — Stock: {p.stock}
            </div>
          </div>
        ),
      }))
    );
  };

  const handleRemove = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed", "success");
  };

  const totalSum = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePay = async () => {
  if (!cart.length) return showToast("No item Selected", "error");
  if (!merchant) return showToast("Select a seller", "error");
  if (!customers) return showToast("Select a customer", "error");

  setLoading(true);


  try {
    const total = totalSum - discount;

    // 1️⃣ Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          customer_name: customers.label,
          merchant_name: merchant.label,
          total,
          discount,
          date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // 2️⃣ Insert each sold item into sale_items table & update stock
    for (const item of cart) {
  const { error: itemError } = await supabase.from("sale_items").insert([
    {
      sale_id: sale.id,
      product_id: item.id, // Ensure this type matches table column
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity,
    },
  ]);
  if (itemError) console.error("Sale item insert failed:", itemError);

    

      // Deduct from stock
      await supaBase
        .from("products")
        .update({ stock: item.stock - item.quantity })
        .eq("id", item.id);
    }

    // 3️⃣ Create receipt object
    const receiptData = {
      id: sale.id,
      customer: customers.label.split(" (")[0], // Only the name
      seller: merchant.label,
      items: cart,
      discount,
      total,
      date: new Date().toLocaleString(),
    };

    setReceipt(receiptData);
    setCart([]);
    showToast("Payment successful", "success");
  } catch (error: any) {
    console.error(error);
    showToast("Payment failed", "error");
  } finally {
    setLoading(false);
  }
};


 return (
  <div className="min-h-screen bg-gray-100 flex flex-col justify-between">
    <main className="flex-1 p-6 overflow-auto text-black">
      {/* ACTION AREA */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Customer */}
        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="font-semibold mb-1 block">
            Customer{" "}
            <span onClick={()=> setShowAddCustomer(true)} className="ml-3 underline cursor-pointer text-blue-500 text-sm">
              Add customer
            </span>
          </label>
          <Select
            placeholder="Select a Customer"
            value={customers}
           onChange={(option) => setCustomer(option as { label: string; value: string } | null)}
           options={[{ value: "walk-in", label: "Walk-in Customer" }, ...customerOptions]}
            isSearchable
          />
        </div>

        {/* Products */}
        <div className="flex-1 min-w-[500px] max-w-[600px]">
          <label className="font-semibold mb-1 block">Products</label>
          <AsyncSelect
            placeholder="Search or select a Product"
            inputValue={productInput}
            onInputChange={(val, { action }) => {
              if (action === "input-change") setProductInput(val);
              if (action === "menu-close") setProductInput("");
            }}
            onChange={(selected) => {
              handleSelectProduct(selected);
              setProductInput("");
            }}
            loadOptions={loadOptions}
            cacheOptions
            defaultOptions={products.map((p) => ({
              value: p.id,
              label: (
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    ₦{p.price.toLocaleString()} — Stock: {p.stock}
                  </div>
                </div>
              ),
            }))}
            isSearchable
            styles={{
              container: (base) => ({ ...base, width: "100%" }),
            }}
          />
        </div>

        {/* Seller */}
        <div className="flex-1 min-w-[200px] max-w-[250px]">
         <label className="font-semibold mb-1 block">
            Merchant{" "}
            <span onClick={()=> setShowAddMerchant(true)} className="ml-3 underline cursor-pointer text-blue-500 text-sm">
              Add Merchant
            </span>
          </label>
          <Select
            placeholder="Select a Merchant"
            value={merchant}
            onChange={(option) => setMerchant(option as { label: string; value: string } | null)}
           options={[{ value: "Ashirov", label: "Ashirov Technology" }, ...merchantOptions]}
            isSearchable
          />
        </div>
      </div>

      {/* CART TABLE */}
      <div className="bg-white rounded-lg shadow p-4 mb-20">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Product</th>
              <th className="p-2">Price</th>
              <th className="p-2 text-center">Quantity</th>
              <th className="p-2 text-center">Subtotal</th>
              <th className="p-2 text-center">X</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-2 border">{item.name}</td>
                <td className="p-2 border">₦{item.price.toLocaleString()}</td>
                <td className="p-2 border text-center">
                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, Number(e.target.value))
                    }
                    className="w-16 border rounded text-center"
                  />
                </td>
                <td className="p-2 border text-center">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-700"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>

   {/* BOTTOM BAR */}
<div className="fixed bottom-0 left-48 right-0 bg-white shadow-lg p-4 flex justify-between items-center border-t">
  <div className="flex gap-8">
    {/* Total Items */}
    <div>
      <h3 className="text-black font-bold">
        Items: <span className="text-gray-700">{cart.length}</span>
      </h3>
    </div>

    {/* Discount */}
    <div>
      <h3 className="text-black font-bold">
        Discount (-):{" "}
        <input
          type="number"
          placeholder="0"
          min="0"
          className="border-b border-gray-400 w-20 text-center outline-none text-gray-700"
          onChange={(e) => setDiscount(Number(e.target.value) || 0)}
        />
      </h3>
    </div>

    {/* Total */}
    <div>
      <h3 className="text-black font-bold">
        Total:{" "}
        <span className="text-gray-700">
          ₦{(totalSum - discount).toLocaleString()}
        </span>
      </h3>
    </div>
  </div>

  {/* Pay Button */}
  <button
    onClick={handlePay}
    disabled={loading}
    className={`${
      loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
    } text-white px-6 py-2 rounded-lg font-bold text-lg shadow`}
  >
    {loading ? "Processing..." : "PAY"}
  </button>
</div>

{/* RECEIPT MODAL */}
{receipt && (
  <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
)}

{/* TOAST */}
{toast && (
  <div
    className={`fixed bottom-20 right-4 p-4 rounded shadow ${
      toast.type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white`}
  >
    {toast.message}
  </div>
)}

{showAddCustomer && (
  <CustomerModal
    onClose={() => setShowAddCustomer(false)}
    onCustomerAdded={(newCustomer: any) => {
      const newOption = {
        value: newCustomer.id,
        label: `${newCustomer.name}${newCustomer.phone_number ? ` (${newCustomer.phone_number})` : ""}`,
      };
      setCustomerOptions((prev) => [...prev, newOption]);
      setCustomer(newOption);
      setShowAddCustomer(false);
    }}
  />
)}

{showAddMerchant && (
  <MerchantModal
    onClose={() => setShowAddMerchant(false)}
    onMerchantAdded={(newMerchant: any) => {
      const newOption = {
        value: newMerchant.id,
        label: newMerchant.name,
      };
      setMerchantOptions((prev) => [...prev, newOption]);
      setMerchant(newOption);
      setShowAddMerchant(false);
    }}
  />
)}


    {/* TOAST */}
    {toast && (
      <div
        className={`fixed bottom-20 right-4 p-4 rounded shadow ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}
      >
        {toast.message}
      </div>
    )}
  </div>
);

}
