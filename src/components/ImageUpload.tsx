import React, { useState, useEffect } from "react";
import { Upload, X, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { uploadToCloudinary } from "../lib/cloudinary";
import { cn } from "../lib/utils";

import imageCompression from "browser-image-compression";

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  className?: string;
  multiple?: boolean;
}

export function ImageUpload({ onUploadComplete, className, multiple = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setUploadProgress(0);

    const newPreviews = files.map((file: File) => URL.createObjectURL(file));
    setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);

    try {
      const results: string[] = [];
      const totalSteps = files.length * 2; // Compression + Upload for each
      let currentStep = 0;

      for (const file of files as File[]) {
        // Step 1: Compress
        setIsCompressing(true);
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        setIsCompressing(false);

        // Step 2: Upload
        setIsUploading(true);
        const url = await uploadToCloudinary(compressedFile);
        results.push(url);
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      }

      const finalUrls = multiple ? [...uploadedUrls, ...results] : results;
      setUploadedUrls(finalUrls);
      onUploadComplete(finalUrls);
    } catch (err: any) {
      console.error("Upload process error:", err);
      setError(err.message || "فشل معالجة أو رفع الصور");
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...previews];
    const newUrls = [...uploadedUrls];
    
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    newUrls.splice(index, 1);
    
    setPreviews(newPreviews);
    setUploadedUrls(newUrls);
    onUploadComplete(newUrls);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-[24px] p-6 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] group overflow-hidden",
          previews.length > 0 ? "border-brand-success bg-brand-success/5" : "border-white/10 hover:border-brand-success/40 bg-white/[0.02]"
        )}
      >
        {(isUploading || isCompressing) && (
          <div className="absolute inset-0 z-20 bg-brand-bg/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-10">
            <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-brand-accent"
              />
            </div>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest text-center">
              {isCompressing ? "جاري ضغط الصور..." : `جاري الرفع... ${uploadProgress}%`}
            </p>
          </div>
        )}

        {previews.length > 0 ? (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative group/item aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${idx}`}
                    className="w-full h-full object-cover rounded-xl border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform z-10 border-2 border-brand-sidebar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {multiple && (
                <label className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-accent/40 hover:bg-white/[0.02] transition-all">
                  <Upload size={20} className="text-white/30" />
                  <span className="text-[9px] font-bold text-white/30 uppercase">إضافة أخرى</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </label>
              )}
            </div>
            <div className="flex items-center gap-2 text-brand-success font-black text-[10px] uppercase tracking-widest justify-center">
              <CheckCircle2 size={14} />
              {uploadedUrls.length} Assets Verified
            </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full gap-4 py-6">
            <div className="p-5 bg-white/5 text-brand-accent rounded-2xl border border-white/5 group-hover:scale-110 transition-transform group-hover:border-brand-accent/30 group-hover:text-brand-accent">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-white/80 uppercase tracking-widest text-xs">اضغط أو اسحب {multiple ? "صور المنتج" : "صورة المنتج"}</p>
              <p className="text-[10px] text-white/20 mt-2 font-bold tracking-tighter italic">HIGH-RESOLUTION JPG/PNG SUPPORTED</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}

        {error && (
          <p className="text-[10px] text-rose-400 mt-4 font-black uppercase tracking-tighter text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
