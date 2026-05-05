import React, { useState, useEffect } from "react";
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinary";
import { cn } from "../lib/utils";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export function ImageUpload({ onUploadComplete, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadToCloudinary(file);
      onUploadComplete(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onUploadComplete("");
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-[24px] p-6 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] group overflow-hidden",
          preview ? "border-brand-success bg-brand-success/5" : "border-white/10 hover:border-brand-success/40 bg-white/[0.02]"
        )}
      >
        {isUploading && (
          <div className="absolute inset-0 z-20 bg-brand-bg/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-success animate-spin" />
            <p className="text-xs font-black text-brand-success uppercase tracking-widest">UPLOADING ASSET...</p>
          </div>
        )}

        {preview ? (
          <div className="relative w-full h-full flex flex-col items-center">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-44 object-cover rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={clear}
              className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform z-10 border-4 border-brand-sidebar"
            >
              <X size={16} />
            </button>
            <div className="mt-4 flex items-center gap-2 text-brand-success font-black text-[10px] uppercase tracking-widest">
              <CheckCircle2 size={14} />
              Asset Verified & Uploaded
            </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full gap-4 py-6">
            <div className="p-5 bg-white/5 text-brand-accent rounded-2xl border border-white/5 group-hover:scale-110 transition-transform group-hover:border-brand-accent/30 group-hover:text-brand-accent">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-white/80 uppercase tracking-widest text-xs">اضغط أو اسحب صورة المنتج</p>
              <p className="text-[10px] text-white/20 mt-2 font-bold tracking-tighter italic">HIGH-RESOLUTION JPG/PNG SUPPORTED</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}

        {error && (
          <p className="text-[10px] text-rose-400 mt-4 font-black uppercase tracking-tighter">{error}</p>
        )}
      </div>
    </div>
  );
}
