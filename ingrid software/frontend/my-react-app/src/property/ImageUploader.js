import React, { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function ImageUploader({ images, setImages }) {
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          file,
          preview: reader.result,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onDrop = useCallback(
    async (acceptedFiles) => {
      try {
        const convertedImages = await Promise.all(
          acceptedFiles.map((file) => fileToBase64(file))
        );

        setImages((prev) => [...prev, ...convertedImages]);
      } catch (error) {
        console.error("Image conversion failed:", error);
      }
    },
    [setImages]
  );

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (
          image?.preview &&
          typeof image.preview === "string" &&
          image.preview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  return (
    <div>
      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drag & drop images or click to upload</p>
      </div>

      <div className="preview-grid">
        {images.map((image, index) => (
          <div
            key={index}
            style={{ position: "relative" }}
          >
            <img
              src={image.preview || image}
              alt={`preview-${index}`}
            />

            <button
              type="button"
              onClick={() => removeImage(index)}
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                border: "none",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                background: "rgba(0,0,0,0.7)",
                color: "white",
                fontWeight: "bold",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}