import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('last_name');
    if (!error) setStudents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function create(student) {
    const { data, error } = await supabase.from('students').insert(student).select().single();
    if (!error) { await fetch(); return { data }; }
    return { error };
  }

  async function update(id, updates) {
    const { error } = await supabase.from('students').update(updates).eq('id', id);
    if (!error) await fetch();
    return { error };
  }

  return { students, loading, refetch: fetch, create, update };
}
