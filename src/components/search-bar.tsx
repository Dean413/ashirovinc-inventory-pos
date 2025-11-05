"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseclient";

type Product = {
  id: string;
  name: string;
  slug: string;
  brand?: { name: string } | null;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch from Supabase
useEffect(() => {
  if (!query) {
    setResults([]);
    return;
  }

  const fetchResults = async () => {
    setLoading(true);

    let { data, error } = await supabase
      .from("products")
      .select("id, name, slug, brand") // brand is just a string column
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`);

    if (error) {
      console.error("Search error:", error);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  };

  fetchResults();
}, [query]);


  return (
    <div className="relative w-64 hidden md:flex">
      {/* Search box */}
      <div className="flex items-center border border-blue-300 rounded-lg px-2 py-1 bg-white">
        {focused && (
          <button
            onClick={() => {
              setFocused(false);
              setQuery("");
            }}
            className="mr-2"
          >
            <ArrowLeft size={20} className="text-blue-600" />
          </button>
        )}
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 outline-none px-2 text-gray-700"
        />
        <Search size={20} className="text-blue-600" />
      </div>

      {/* Dropdown results */}
      {focused && query && (
        <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {loading ? (
            <p className="px-4 py-2 text-gray-500">Searching...</p>
          ) : results.length > 0 ? (
            results.map((item) => (
              <Link
  key={item.id}
  href={`/products/${item.slug}`}
  onClick={() => {
    setFocused(false);
    setQuery("");
  }}
  className="block px-4 py-2 hover:bg-blue-100 text-gray-700"
>
  {item.name}
  {item.brand ? ` (${item.brand})` : ""}
</Link>

            ))
          ) : (
            <p className="px-4 py-2 text-gray-500">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}
