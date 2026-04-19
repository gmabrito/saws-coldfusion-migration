const STATUS_LABELS = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_review: 'In Review',
  pending_response: 'Pending Response',
  completed: 'Completed',
  denied: 'Denied',
  partial: 'Partial',
};

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge badge-${status}`}>{label}</span>
  );
}
