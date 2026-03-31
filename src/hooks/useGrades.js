import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setGrades(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function create(grade) {
    const { error } = await supabase.from('grades').insert(grade);
    if (!error) await fetch();
    return { error };
  }

  return { grades, loading, refetch: fetch, create };
}
