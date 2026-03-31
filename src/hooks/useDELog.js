import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDELog() {
  const [deLogs, setDELogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('de_log')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setDELogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function create(entry) {
    const { error } = await supabase.from('de_log').insert(entry);
    if (!error) await fetch();
    return { error };
  }

  return { deLogs, loading, refetch: fetch, create };
}
