export default function EmptyState({ icon, message, colSpan }) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
          {message}
        </td>
      </tr>
    );
  }
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <p>{message}</p>
    </div>
  );
}
