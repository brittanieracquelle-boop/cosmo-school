import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAttendance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance_log')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function clockIn(studentId) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const clockIn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const { error } = await supabase.from('attendance_log').insert({
      student_id: studentId,
      date,
      clock_in: clockIn,
    });
    if (!error) await fetch();
    return { error };
  }

  async function clockOut(logId, clockInTime) {
    const now = new Date();
    const clockOutTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const [ih, im] = clockInTime.split(':').map(Number);
    const [oh, om] = clockOutTime.split(':').map(Number);
    const hours = parseFloat(((oh * 60 + om - ih * 60 - im) / 60).toFixed(2));
    const { error } = await supabase.from('attendance_log').update({
      clock_out: clockOutTime,
      hours,
    }).eq('id', logId);
    if (!error) await fetch();
    return { error };
  }

  async function update(id, updates) {
    if (updates.clock_in && updates.clock_out) {
      const [ih, im] = updates.clock_in.split(':').map(Number);
      const [oh, om] = updates.clock_out.split(':').map(Number);
      updates.hours = parseFloat(((oh * 60 + om - ih * 60 - im) / 60).toFixed(2));
    }
    const { error } = await supabase.from('attendance_log').update(updates).eq('id', id);
    if (!error) await fetch();
    return { error };
  }

  async function remove(id) {
    const { error } = await supabase.from('attendance_log').delete().eq('id', id);
    if (!error) await fetch();
    return { error };
  }

  return { logs, loading, refetch: fetch, clockIn, clockOut, update, remove };
}
