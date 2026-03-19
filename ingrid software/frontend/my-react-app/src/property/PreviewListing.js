export default function PreviewListing({ property, images }) {

  return (
    <div className="preview-card">

      <h2>Preview Listing</h2>

      {images.length > 0 && (
        <img src={images[0].preview} alt="preview"/>
      )}

      <h3>{property.title}</h3>

      <p>{property.address}</p>

      <p>${property.price}</p>

      <p>
        {property.bedrooms} Beds | {property.bathrooms} Baths | {property.size} sqft
      </p>

      <p>{property.description}</p>

    </div>
  );
}