import ocr from "@/service/ocr";
import storageUtil from "@/service/storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 클라이언트에서 보내온 FormData를 가져옵니다.
  const formData = await req.formData();
  const file = formData.get("document") as File;

  const src = storageUtil.uploadFile(file)

  console.log(src)

  const result = await ocr.read(file)

  

  return NextResponse.json({
    message: result
  })
}
