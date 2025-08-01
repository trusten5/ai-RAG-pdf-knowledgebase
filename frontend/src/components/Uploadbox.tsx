// not in use

'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadBox({ onUpload }: { onUpload: (file: File) => void }) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed p-8 rounded-2xl max-w-md mx-auto text-center transition-colors ${
        isDragActive ? 'bg-accent/10 border-accent' : 'border-muted bg-background'
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-accent font-semibold">Drop your document here</p>
      ) : (
        <p className="text-muted">
          Drag & drop a PDF/DOCX/PPTX, or click to select
        </p>
      )}
    </div>
  );
}
