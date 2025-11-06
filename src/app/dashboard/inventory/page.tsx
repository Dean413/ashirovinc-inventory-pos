"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import ProductForm from "@/components/product-form";
import { supaBase } from "@/lib/supabaseclient";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";
import dynamic from "next/dynamic";
import FullPageLoader from "@/components/page-reloader";

interface Product {
  id: number;
  name: string;
  brand: string;
  price?: number;
  stock?: number;
  image_url?: string[];
  description?: string[];
  display?: string;
  ram?: string;
  storage?: string;
  cost_price: number;
  supplier_name: string;
  supplier_contact?: number;
  last_restock_date?: number;
  category?: string;
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999999 });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const alertShown = useRef(false);

  // ✅ Fetch products
  const fetchProducts = async () => {
    const { data, error } = await supaBase.from("products").select("*").order("id");
    if (error) console.error(error);
    else setProducts(data as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Delete product
  const deleteProduct = async (id: number) => {
    const result = await Swal.fire({
      title: "Delete this product?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;
    setDeletingId(id);

    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete product");

      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };


  // ✅ Summary stats
  const summary = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const totalCostValue = products.reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock || 0)), 0);
    const totalSellValue = products.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 0)), 0);

    // Calculate total stock by brand & category
    const stockByBrand: Record<string, number> = {};
    const stockByCategory: Record<string, number> = {};
    for (const p of products) {
      if (p.brand) stockByBrand[p.brand] = (stockByBrand[p.brand] || 0) + (p.stock || 0);
      if (p.category) stockByCategory[p.category] = (stockByCategory[p.category] || 0) + (p.stock || 0);
    }

    return {
      totalProducts,
      totalStock,
      totalCostValue,
      totalSellValue,
      stockByBrand,
      stockByCategory,
    };
  }, [products]);

  // ✅ Safe formatted values
  const formattedSummary = useMemo(() => ({
    totalStock: summary.totalStock.toLocaleString(),
    totalCostValue: summary.totalCostValue.toLocaleString(),
    totalSellValue: summary.totalSellValue.toLocaleString(),
  }), [summary]);

  // ✅ Group stock by brand
  const stockByBrand = useMemo(() => {
    const brandTotals: Record<string, number> = {};
    products.forEach((p) => {
      if (p.brand) {
        brandTotals[p.brand] = (brandTotals[p.brand] || 0) + (p.stock || 0);
      }
    });
    return brandTotals;
  }, [products]);

  // ✅ Group stock by category
  const stockByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        categoryTotals[p.category] = (categoryTotals[p.category] || 0) + (p.stock || 0);
      }
    });
    return categoryTotals;
  }, [products]);

  useEffect(() => {
    // Ensure products are loaded before checking
    if (!products || products.length === 0) return;

    // Prevent duplicate alerts
    if (alertShown.current) return;
    alertShown.current = true;

    // Filter products below 10
    const lowStockItems = products.filter((p) => Number(p.stock ?? 0) < 10);

    if (lowStockItems.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Low Stock Alert ⚠️",
        html: `
          <ul style="text-align:left;">
            ${lowStockItems
              .map((p) => `<li><b>${p.name}</b>: ${p.stock} left</li>`)
              .join("")}
          </ul>
        `,
      });
    } else {
      console.log("✅ All stocks are fine");
    }
  }, [products]); 

  // ✅ Brand, category, and name filters
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const names = Array.from(new Set(products.map((p) => p.name).filter(Boolean)));

  // ✅ Apply filters
  const filteredProducts = products.filter((p) => {
    const matchesBrand = !selectedBrand || selectedBrand === "All" || p.brand === selectedBrand;
    const matchesCategory = !selectedCategory || selectedCategory === "All" || p.category === selectedCategory;
    const matchesName = !selectedName || selectedName === "All" || p.name === selectedName;
    const matchesPrice =
      (!priceRange.min || (p.price ?? 0) >= priceRange.min) &&
      (!priceRange.max || (p.price ?? 0) <= priceRange.max);
    return matchesBrand && matchesCategory && matchesName && matchesPrice;
  });

  if (loading) return <FullPageLoader text="Loading....." />;

  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>

      <ProductForm fetchProducts={fetchProducts} editProduct={editingProduct || undefined} />

      {/* ✅ Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-10">
        <div className="bg-blue-100 p-4 rounded-xl shadow-sm text-center">
          <p className="text-gray-600 text-sm">Total Products</p>
          <h2 className="text-2xl font-bold text-blue-800">{summary.totalProducts}</h2>
        </div>
        <div className="bg-green-100 p-4 rounded-xl shadow-sm text-center">
          <p className="text-gray-600 text-sm">Total Stock</p>
          <h2 className="text-2xl font-bold text-green-800">{formattedSummary.totalStock}</h2>
        </div>
        <div className="bg-yellow-100 p-4 rounded-xl shadow-sm text-center">
          <p className="text-gray-600 text-sm">Total Cost Value</p>
          <h2 className="text-2xl font-bold text-yellow-800">₦{formattedSummary.totalCostValue}</h2>
        </div>
        <div className="bg-purple-100 p-4 rounded-xl shadow-sm text-center">
          <p className="text-gray-600 text-sm">Total Selling Value</p>
          <h2 className="text-2xl font-bold text-purple-800">₦{formattedSummary.totalSellValue}</h2>
        </div>
      </div>

      {/* ✅ Stock Summary by Brand and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        {/* By Brand */}
        <div className="bg-blue-50 p-4 rounded-xl shadow">
          <h3 className="font-semibold text-blue-800 mb-3">Stock by Brand</h3>
          <ul className="text-sm space-y-1">
            {Object.entries(stockByBrand).map(([brand, total]) => (
              <li key={brand} className="flex justify-between border-b py-1">
                <span>{brand}</span>
                <span className="font-bold">{total.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* By Category */}
        <div className="bg-green-50 p-4 rounded-xl shadow">
          <h3 className="font-semibold text-green-800 mb-3">Stock by Category</h3>
          <ul className="text-sm space-y-1">
            {Object.entries(stockByCategory).map(([category, total]) => (
              <li key={category} className="flex justify-between border-b py-1">
                <span>{category}</span>
                <span className="font-bold">{total.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ✅ Filter Section */}
      <section className="px-6 py-8 bg-gray-50 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            placeholder="Filter by Brand"
            options={[{ value: "All", label: "All" }, ...brands.map((b) => ({ value: b, label: b }))]}
            onChange={(opt) => setSelectedBrand(opt?.value || null)}
            isClearable
          />

          <Select
            placeholder="Filter by Category"
            options={[{ value: "All", label: "All" }, ...categories.map((c) => ({ value: c, label: c }))]}
            onChange={(opt) => setSelectedCategory(opt?.value || null)}
            isClearable
          />

          <Select
            placeholder="Filter by Name"
            options={[{ value: "All", label: "All" }, ...names.map((n) => ({ value: n, label: n }))]}
            onChange={(opt) => setSelectedName(opt?.value || null)}
            isClearable
          />

          {/* Price Range */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="border border-gray-300 bg-white rounded p-2 w-1/2"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: Number(e.target.value) }))}
              />
              <input
                type="number"
                className="border border-gray-300 bg-white rounded p-2 w-1/2"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Product Table */}
      <table className="w-full bg-white shadow rounded mt-6">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Brand</th>
            <th className="p-2 text-left">Cost Price</th>
            <th className="p-2 text-left">Selling Price</th>
            <th className="p-2 text-left">Supplier</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id} className={`border-b hover:bg-gray-50 ${p.stock! < 10 ? "bg-red-50" : ""}`}>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.category || "-"}</td>
              <td className="p-2">{p.brand}</td>
              <td className="p-2">₦{p.cost_price?.toLocaleString()}</td>
              <td className="p-2">₦{p.price?.toLocaleString()}</td>
              <td className="p-2">{p.supplier_name}</td>
              <td className="p-2 font-bold">{p.stock}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => deleteProduct(p.id)}
                  disabled={deletingId === p.id}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  {deletingId === p.id ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ✅ Disable SSR to avoid hydration mismatches
export default dynamic(() => Promise.resolve(AdminProducts), { ssr: false });
