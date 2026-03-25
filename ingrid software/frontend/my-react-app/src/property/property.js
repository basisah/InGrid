import React, { useState } from "react";
import ImageUploader from "./ImageUploader";
import LocationMap from "./LocationMap";
import PreviewListing from "./PreviewListing";
import "./postproperty.css";

export default function PostProperty(){

  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [preview, setPreview] = useState(false);

  const [property, setProperty] = useState({
    title:"",
    address:"",
    type:"rental",
    price:"",
    bedrooms:"",
    bathrooms:"",
    size:"",
    description:""
  });

  const handleChange = (e)=>{
    setProperty({...property,[e.target.name]:e.target.value});
  };

  const saveDraft = ()=>{
    localStorage.setItem("propertyDraft", JSON.stringify(property));
    alert("Draft saved!");
  };

  
  const submitProperty = async ()=>{
    if (!property.title || !property.price || !property.address) {
      alert("Please fill required fields");
       return;
    }
    const token = localStorage.getItem("token");

    const response = await fetch("/api/properties",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${token}`
      },
      body:JSON.stringify({
        ...property,
        latitude:location?.lat,
        longitude:location?.lng
      })
    });

    const data = await response.json();
    alert(data.message);
  };

  return(

    <div className="post-container">

      <h1>Create Listing</h1>

      <ImageUploader images={images} setImages={setImages}/>

      <input name="title" placeholder="Title" onChange={handleChange}/>

      <input name="price" placeholder="Price" onChange={handleChange}/>

      <input name="address" placeholder="Address" onChange={handleChange}/>

      <LocationMap setLocation={setLocation}/>

      <textarea
        name="description"
        placeholder="Description"
        onChange={handleChange}
      />

      <div className="buttons">

        <button onClick={saveDraft}>Save Draft</button>

        <button onClick={()=>setPreview(true)}>Preview</button>

        <button onClick={submitProperty}>Post Listing</button>

      </div>

      {preview && (
        <PreviewListing
          property={property}
          images={images}
        />
      )}

    </div>
  );
}