"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseclient";
import FullPageLoader from "@/components/page-reloader";

interface RecordItem {
  id: number;
  customer_name: string;
  product_name: string;
  remark: string;
  [key: string]: any;
}

export default function ReportsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();

    // optional: real-time updates
    const subscription = supabase
      .channel("public:general_record")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "general_record" },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("general_record").select("*");
    if (!error && data) {
      // 🔥 Remove delivered records
      const filtered = data.filter(
        (r) => r.remark?.toLowerCase() !== "delivered"
      );
      setRecords(filtered as RecordItem[]);
    }
    setLoading(false);
  };

  const filterByRemark = (remark: string) => {
    return records.filter(
      (r) => r.remark?.toLowerCase() === remark.toLowerCase()
    );
  };

  if (loading) return <FullPageLoader text="Loading reports..." />;

  return (
    <div className="p-6 space-y-8 text-gray-800">
      
        <>
          <Section
            title="🛠️ Work In Progress"
            data={filterByRemark("Work In Progress")}
          />
          <Section title="✅ Job Done" data={filterByRemark("Job Done")} />
          <Section title="💰 Debtor" data={filterByRemark("Debtor")} />
        </>
      
    </div>
  );
}

interface SectionProps {
  title: string;
  data: RecordItem[];
}

function Section({ title, data }: SectionProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No records available</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Customer</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Remark</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="border p-2">{item.customer_name}</td>
                <td className="border p-2">{item.product_name}</td>
                <td className="border p-2">{item.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
