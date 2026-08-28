import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";

const BUCKET = "chat_attachments";
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "No file selected." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: "File must be 10 MB or smaller." }, { status: 400 });
    }

    const { data: buckets, error: bucketsError } = await adminSupabase.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json({ success: false, message: bucketsError.message }, { status: 500 });
    }

    if (!buckets?.some((bucket: any) => bucket.name === BUCKET)) {
      const { error } = await adminSupabase.storage.createBucket(BUCKET, { public: true });

      if (error && !/already exists/i.test(error.message)) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${profile.id}/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: uploadError.message }, { status: 500 });
    }

    const { data } = adminSupabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: data.publicUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
