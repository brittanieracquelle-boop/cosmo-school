import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAbsences() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('absences')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setAbsences(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function create(absence) {
    const { error } = await supabase.from('absences').insert(absence);
    if (!error) await fetch();
    return { error };
  }

  async function update(id, updates) {
    const { error } = await supabase.from('absences').update(updates).eq('id', id);
    if (!error) await fetch();
    return { error };
  }

  async function recordDailyAbsences() {
    const { data, error } = await supabase.rpc('record_daily_absences');
    if (!error) await fetch();
    return { data, error };
  }

  return { absences, loading, refetch: fetch, create, update, recordDailyAbsences };
}
