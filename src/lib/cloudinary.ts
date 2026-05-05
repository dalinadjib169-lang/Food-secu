/**
 * Global utility for Cloudinary Unsigned Upload
 * Cloud Name: doaxziqm7
 * Upload Preset: nadjib dali
 */

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "nadjib dali");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/doaxziqm7/image/upload`,
      {
        method: "POST",
        body: formData,
        mode: 'cors',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Detailed Error:", error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("تعذر الاتصال بخوادم الصور. يرجى التحقق من اتصال الإنترنت.");
    }
    throw error;
  }
};
