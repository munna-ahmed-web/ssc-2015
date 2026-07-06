import type { NextRequest } from "next/server";

import { connectDB } from "@/lib/db";
import { MembershipApplication } from "@/models";
import { ApplicationSchema } from "@/lib/validation/application.schema";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api/response";
import {
  duplicateSummaryMessage,
  findApplicationDuplicates,
} from "@/lib/applications/duplicate-check";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function serializeApplication(application: {
  _id: { toString(): string };
  status: string;
  fullName: string;
  phone: string;
  nid: string;
  createdAt: Date;
}) {
  return {
    id: application._id.toString(),
    status: application.status,
    fullName: application.fullName,
    phone: application.phone,
    nid: application.nid,
    createdAt: application.createdAt.toISOString(),
  };
}

/**
 * POST /api/applications
 * Public — create a membership application.
 *
 * Accepts:
 *  - application/json (mobile / API clients without photo upload)
 *  - multipart/form-data (web form with optional photo)
 *
 * Responses:
 *  - 201 Created — application stored
 *  - 409 Conflict — duplicate phone or NID (pending/approved)
 *  - 422 Unprocessable Entity — validation errors
 *  - 413 Payload Too Large — photo exceeds limit
 *  - 415 Unsupported Media Type — invalid photo type
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get("content-type") || "";
    let data: ReturnType<typeof ApplicationSchema.parse>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      let photoUrl: string | undefined;

      if (file && file.size > 0) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
          return apiError(
            "UNSUPPORTED_MEDIA_TYPE",
            "Only JPEG, PNG, and WebP images are accepted.",
            415,
          );
        }
        if (file.size > MAX_PHOTO_BYTES) {
          return apiError("PAYLOAD_TOO_LARGE", "Photo must be smaller than 5 MB.", 413);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { url } = await uploadToCloudinary(buffer, {
          folder: "foundation/member_photos",
          transformation: [
            {
              width: 400,
              height: 400,
              crop: "fill",
              gravity: "face",
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        });
        photoUrl = url;
      }

      const rawData = {
        fullName: formData.get("fullName") as string,
        guardianName: formData.get("guardianName") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        nid: formData.get("nid") as string,
        address: formData.get("address") as string,
        dateOfBirth: formData.get("dateOfBirth") as string,
        occupation: formData.get("occupation") as string,
        requestedContributionType: formData.get("requestedContributionType") as string,
        requestedContributionAmount: formData.get("requestedContributionAmount") as string,
        photoUrl,
      };

      data = ApplicationSchema.parse(rawData);
    } else {
      const body = await req.json();
      data = ApplicationSchema.parse(body);
    }

    if (data.email === "") data.email = undefined;
    if (data.occupation === "") data.occupation = undefined;

    const duplicateResult = await findApplicationDuplicates(data.phone, data.nid);
    if (duplicateResult.duplicate) {
      return apiError(
        "DUPLICATE_ENTRY",
        duplicateSummaryMessage(duplicateResult.conflicts),
        409,
        duplicateResult.fieldErrors,
      );
    }

    const application = await MembershipApplication.create({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
      status: "pending",
    });

    return apiSuccess(serializeApplication(application), {
      message: "Application submitted successfully.",
      status: 201,
    });
  } catch (err) {
    return handleRouteError(err, "[POST /api/applications]");
  }
}
