import { Bus, Bike, CarFront, ArrowUpRight } from 'lucide-react';
export default function Transport() {
  return (
    <section className="transport-panel">
      <div className="section-eyebrow">
        <Bus size={16} /> THE NEXT MILE
      </div>
      <h2>
        One trip.
        <br />
        More possibilities.
      </h2>
      <p className="muted">A home for future transit and ride-booking connections.</p>
      {[
        {
          icon: Bus,
          title: 'Public transport',
          text: 'Plan the first and last mile around a metro or bus journey.',
        },
        {
          icon: CarFront,
          title: 'Cab partners',
          text: 'Future partner integration for availability, quotes and booking.',
        },
        {
          icon: Bike,
          title: 'Bike & auto partners',
          text: 'A flexible last-mile connection for short city trips.',
        },
      ].map(({ icon: Icon, title, text }) => (
        <div className="transport-card" key={title}>
          <Icon size={24} />
          <h3>{title}</h3>
          <p>{text}</p>
          <span className="mini-badge">Coming later · not connected</span>
        </div>
      ))}
      <p className="fine-print">
        No live fares, availability, or bookings are provided in this demo. The code includes a
        documented server-side adapter for an approved transport partner.
      </p>
    </section>
  );
}
