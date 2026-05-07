import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

export async function uploadBuffer(
  buf: Buffer,
  options: { folder: string; publicId?: string; resourceType?: "auto" | "raw" | "image" } = {
    folder: "flux/uploads",
  },
) {
  return new Promise<{ url: string; publicId: string; bytes: number }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder, public_id: options.publicId, resource_type: options.resourceType ?? "auto" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id, bytes: result.bytes });
      },
    );
    stream.end(buf);
  });
}
