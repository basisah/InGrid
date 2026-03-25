import React, { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";

export default function ImageUploader({ images, setImages }) {

  const onDrop = useCallback((acceptedFiles) => {
  const mapped = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    );

    setImages(prev => [...prev, ...mapped]);
  }, [setImages]);

  useEffect(() => {
    return () => {
      images.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop
  });

  return (
    <div>

      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drag & drop images or click to upload</p>
      </div>

      <div className="preview-grid">
        {images.map((file, index) => (
          <img key={index} src={file.preview} alt="preview"/>
        ))}
      </div>

    </div>
  );
}