import { Link } from 'react-router-dom'

export default function DestinationCard({ destination }) {
  return (
    <Link to={`/destinations/${destination.id}`} className="destination-visual-card">
      {destination.imageUrl ? (
        <img src={destination.imageUrl} alt={destination.name} className="destination-visual-image" />
      ) : (
        <div className="destination-visual-image card-image-fallback">No image</div>
      )}
      <div className="destination-visual-overlay">
        <h3>{destination.name}</h3>
        <p className="destination-visual-location">{destination.country || destination.province}</p>
        {destination.description ? <p className="destination-visual-description">{destination.description}</p> : null}
      </div>
    </Link>
  )
}
