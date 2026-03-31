import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useClosures() {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('school_closures')
      .select('*')
      .order('start_date');
    if (!error) setClosures(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function create(closure) {
    const { error } = await supabase.from('school_closures').insert(closure);
    if (!error) await fetch();
    return { error };
  }

  async function remove(id) {
    const { error } = await supabase.from('school_closures').delete().eq('id', id);
    if (!error) await fetch();
    return { error };
  }

  return { closures, loading, refetch: fetch, create, remove };
}
