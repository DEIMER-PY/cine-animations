const STEPS = ['PELÍCULA', 'ASIENTOS', 'CONFIRMACIÓN', 'ENTRADA'];

export default function BookingSteps({ active = 0 }) {
  return <ol className="booking-steps" aria-label="Progreso de compra">{STEPS.map((step, index) => <li key={step} className={index === active ? 'is-active' : index < active ? 'is-done' : ''}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>;
}
