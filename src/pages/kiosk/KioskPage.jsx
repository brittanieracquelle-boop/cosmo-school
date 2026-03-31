import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLiveClock } from '../../hooks/useLiveClock';

export default function KioskPage() {
  const now = useLiveClock();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }
  const [statusChips, setStatusChips] = useState([]);

  const hms = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    const { data } = await supabase.rpc('kiosk_status');
    if (data) setStatusChips(data);
  }

  function pinKey(digit) {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => submitPin(newPin), 120);
    }
  }

  function pinClear() {
    setPin(prev => prev.slice(0, -1));
    setFeedback(null);
  }

  async function submitPin(pinValue) {
    const p = pinValue || pin;
    if (p.length < 4) {
      setFeedback({ type: 'error', message: 'Please enter your 4-digit PIN.' });
      return;
    }

    const { data, error } = await supabase.rpc('kiosk_clock', { pin_input: p });
    if (error || !data?.success) {
      setFeedback({ type: 'error', message: data?.error || error?.message || 'An error occurred.' });
      setPin('');
      return;
    }

    if (data.action === 'clock_in') {
      setFeedback({ type: 'success', message: `Good morning, ${data.first_name}! Clocked in at ${data.time}. Have a great day!` });
    } else {
      setFeedback({ type: 'success', message: `See you tomorrow, ${data.first_name}! Clocked out at ${data.time}. ${data.hours} hrs recorded.` });
    }

    setPin('');
    fetchStatus();
    setTimeout(() => setFeedback(null), 5000);
  }

  return (
    <div className="kiosk-overlay">
      <button className="kiosk-exit" onClick={() => navigate('/')}>&#10005; Exit Kiosk</button>

      <div className="kiosk-header">
        <div className="kiosk-school">Bennett School of Cosmetology</div>
        <div className="kiosk-sub">Student Check-In Station &bull; Decatur, AL</div>
      </div>

      <div className="kiosk-clock">{hms}</div>
      <div className="kiosk-date">{dateStr}</div>

      <div className="kiosk-card">
        <div className="kiosk-step-label">Enter Your PIN</div>
        <div className="kiosk-pin-display">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`pin-dot${i <= pin.length ? ' filled' : ''}`}></span>
          ))}
        </div>
        <div className="kiosk-pin-pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button key={d} className="pin-key" onClick={() => pinKey(d)}>{d}</button>
          ))}
          <button className="pin-key pin-key-clear" onClick={pinClear}>&#9003;</button>
          <button className="pin-key" onClick={() => pinKey('0')}>0</button>
          <button className="pin-key pin-key-action" onClick={() => submitPin()}>&#10003;</button>
        </div>
        {feedback && (
          <div className={`kiosk-feedback ${feedback.type}`}>{feedback.message}</div>
        )}
      </div>

      <div className="kiosk-live-status">
        {statusChips.map((s, i) => (
          <div key={i} className={`kiosk-status-chip${s.clocked_in ? ' in' : ''}`}>
            {s.clocked_in ? <span className="dot pulse"></span> : <span className="dot red"></span>}
            {s.first_name} {s.last_initial}.
          </div>
        ))}
      </div>
    </div>
  );
}
