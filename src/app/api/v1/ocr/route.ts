import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 클라이언트에서 보내온 FormData를 가져옵니다.
  const formData = await req.formData();
  const file = formData.get("document") as File;

  const apiKey = process.env.UPSTAGE_API_KEY as string;

  if (!file) {
    return NextResponse.json({
      message: "파일이 첨부되지 않았습니다."
    });
  }

  try {
    // FormData를 사용하여 파일을 외부 API에 전송합니다.
    const externalFormData = new FormData();
    externalFormData.append("document", file);

    const res = await fetch("https://api.upstage.ai/v1/document-ai/ocr", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        // 'Content-Type': 'multipart/form-data'는 자동으로 설정되므로 제거합니다.
      },
      body: externalFormData
    });

    if (!res.ok) {
      throw new Error(`서버 응답 오류: ${res.status}`);
    }

    const testResult = await res.json();
    return NextResponse.json({
      message: testResult
    });
  } catch (error) {
    console.error("서버 처리 오류:", error);
    return NextResponse.json({
      message: "파일 처리에 실패했습니다."
    });
  }
}
