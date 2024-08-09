import ocr from "@/service/ocr";
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

  const result = await ocr.read(file)

  const inputPrompt = result.message.pages[0].text

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.upstage.ai/v1/solar'
  })

  const classified = await openai.chat.completions.create({
    model: 'solar-1-mini-chat',
    messages: [
      {
        role: 'system',
        content: `
          <Context>
            너는 지금부터 주어진 공공문서를 보고 분류하는 전문가야.
          </Context>

          <Instructions>
            다음 문서의 종류는? 무조건 단어만 말해
            1. 건축물관리대장
            2. 토지대장
          </Instructions>
        `
      },
      {
        role: "user",
        content: inputPrompt
      }
    ],
  });

  const docName = classified.choices[0].message.content

  console.log(docName)

  let instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 불필요한 정보를 제거
      2. 관련이 있는 정보들끼리 매핑
    `

  if (docName == "건축물관리대장") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 불필요한 정보를 제거
      2. 관련이 있는 정보들끼리 매핑
    `
  }

  const chatCompletion = await openai.chat.completions.create({
    model: 'solar-1-mini-chat',
    messages: [
      {
        role: 'system',
        content: `
          <Context>
            너는 지금부터 주어진 ${docName}를 보고 있는 그대로 추출하는 전문가야.
          </Context>

          <Instructions>
            ${instruction}
          </Instructions>
        `
      },
      {
        role: "user",
        content: inputPrompt
      }
    ],
  });

  const ret = chatCompletion.choices[0].message.content

  console.log(ret)

  return NextResponse.json({
    // message: chatCompletion.choices[0].message.content
    message: ret
  })
}
