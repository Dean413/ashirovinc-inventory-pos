
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabaseclient";

export const useTable = (table: string) =>
  useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
