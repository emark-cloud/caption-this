"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  disabled,
}: ImageUploadProps) {
  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
      onChange(result.info.secure_url);
    }
  };

  return (
    <CldUploadWidget
      uploadPreset="caption_this"
      options={{
        maxFiles: 1,
        resourceType: "image",
        sources: ["local", "url", "camera"],
      }}
      onSuccess={handleUpload}
    >
      {({ open }) => (
        <div
          onClick={() => !disabled && open()}
          className={`
            relative flex flex-col items-center justify-center
            w-full h-64 border-2 border-dashed rounded-lg
            transition-colors cursor-pointer
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500"}
            ${value ? "border-green-500" : "border-gray-300"}
          `}
        >
          {value ? (
            <>
              <Image
                src={value}
                alt="Uploaded image"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain rounded-lg"
              />
              <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                Uploaded
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Click to upload an image
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
}
