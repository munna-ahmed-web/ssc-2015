/**
 * Cloudinary utility — singleton configured from env vars.
 * Server-side only. Never import in client components.
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload a file Buffer to Cloudinary.
 * Returns the secure URL and public_id.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    transformation?: object[];
  } = {},
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "foundation/hero",
        public_id: options.public_id,
        resource_type: "image",
        transformation: options.transformation ?? [
          { width: 1920, height: 800, crop: "fill", quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      },
    );
    stream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
