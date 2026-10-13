import { ShieldCheck, Copy, Eye, MapPin } from 'lucide-react';
export default function Safety({ enabled, setEnabled, origin, destination, notify }) {
  return (
    <section className="safety-panel">
      <div className="section-eyebrow">
        <ShieldCheck size={16} /> TRAVEL WITH A LITTLE MORE CARE
      </div>
      <h2>
        Stay aware.
        <br />
        Stay connected.
      </h2>
      <p className="muted">Useful trip tools, with you in control.</p>
      <div className="safety-card">
        <div className="subheading">
          <Eye size={20} />
          <strong>Nearby support points</strong>
        </div>
        <p>Show sample hospital and transit locations on the map.</p>
        <button
          role="switch"
          aria-checked={enabled}
          className={`toggle-row ${enabled ? 'enabled' : ''}`}
          onClick={() => setEnabled(!enabled)}
        >
          <span>Show support layer</span>
          <span className="switch-track">
            <span />
          </span>
        </button>
        <p className="fine-print">
          These locations are demo data. Verify their position and availability. Circles do not
          indicate safe zones.
        </p>
      </div>
      <div className="safety-card">
        <div className="subheading">
          <MapPin size={20} />
          <strong>Keep someone in the loop</strong>
        </div>
        <p>Copy your planned trip, then choose who to share it with.</p>
        <button
          className="secondary full"
          disabled={!origin || !destination}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `My LocalRoute trip: ${origin.name} to ${destination.name}. Destination coordinates: ${destination.coordinates[1]}, ${destination.coordinates[0]}. This is a planned trip, not live location tracking.`,
              );
              notify('Trip details copied. Paste them into your preferred messaging app.');
            } catch {
              notify('Clipboard unavailable. You can copy the place names from the planner.');
            }
          }}
        >
          <Copy size={16} />
          Copy trip details
        </button>
      </div>
      <div className="safety-notice">
        <ShieldCheck size={21} />
        <p>
          LocalRoute does not monitor emergencies or measure route safety. In an emergency, contact
          your local emergency services directly.
        </p>
      </div>
      <h3>A few good travel habits</h3>
      <ul className="travel-tips">
        <li>Choose well-lit, active public streets.</li>
        <li>Check signs and conditions around you.</li>
        <li>Keep a trusted person updated on your plans.</li>
        <li>Pause in a safe place before using your phone.</li>
      </ul>
    </section>
  );
}
