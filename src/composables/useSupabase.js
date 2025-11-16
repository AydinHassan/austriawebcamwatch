import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jfenjuzphvjqznrmjqsg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZW5qdXpwaHZqcXpucm1qcXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTczODcsImV4cCI6MjA3ODc5MzM4N30.mvJU7_dLRIq1MRM5_VWRjyEyFawqq-7cREH4Fx5AKrE";

const supabase = createClient(supabaseUrl, supabaseKey);

export default function useSupabase() {
  return { supabase };
}
