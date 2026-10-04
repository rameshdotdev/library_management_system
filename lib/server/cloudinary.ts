import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfigurationError extends Error {
  constructor() {
    super("Cloudinary image uploads are not configured.");
  }
}

export type UploadedStudentDocument = {
  documentImageUrl: string;
  documentImagePublicId: string;
};

function configuredCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryConfigurationError();
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return cloudinary;
}

export async function uploadStudentDocument(
  dataUrl: string | undefined,
): Promise<UploadedStudentDocument | undefined> {
  if (!dataUrl) return undefined;

  const result = await configuredCloudinary().uploader.upload(dataUrl, {
    folder: "library/student-documents",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    max_bytes: 1_000_000,
  });

  return {
    documentImageUrl: result.secure_url,
    documentImagePublicId: result.public_id,
  };
}

export async function deleteStudentDocument(publicId?: string) {
  if (!publicId) return;

  try {
    await configuredCloudinary().uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("Cloudinary document cleanup failed", error);
  }
}
