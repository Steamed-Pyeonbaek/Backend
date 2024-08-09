import banking from "@/service/banking";
import ocr from "@/service/ocr";
import postProcessor from "@/service/postprocessor";
import storageUtil from "@/service/storage";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  // 클라이언트에서 보내온 FormData를 가져옵니다.
  const formData = await req.formData();
  const file = formData.get("document") as File;
  const apiKey = process.env.UPSTAGE_API_KEY as string;

  // const src = storageUtil.uploadFile(file)

  // console.log(src)

  const result = await ocr.read(file);

  const inputPrompt = result.message.pages[0].text;

  // const paidHistory = banking.getPaidHistory();
  // console.log(paidHistory);
  // const classifiedList = await postProcessor.classify(paidHistory);
  // console.log(classifiedList);
  // const history = classifiedList.join("\n");
  // console.log(history);
  const extracted = await postProcessor.extract(inputPrompt);
  // console.log(extracted);

  const ret = await postProcessor.calculate(
    "거래내역은 존재하지 않음",
    extracted
  );

  return NextResponse.json({
    // message: chatCompletion.choices[0].message.content
    message: ret,
  });
}
