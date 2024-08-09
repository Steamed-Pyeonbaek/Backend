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
      1. 각 공공문서를 보고 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 불필요한 정보를 제거
      3. 관련이 있는 정보들끼리 매핑
      4. 부가적인 설명&참고는 생략
      5. 필요없는 괄호는 생략/ 가시적으로 보여줘
    `

  if (docName == "건축물관리대장") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
    `
  }

  if (docName == "등기부등본") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 우선 추출
    `
  }

  if (docName == "배출시설 허가증") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
    1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
    2. 대기배출 보고서의 경우 연료사용량, 오염물질 등을 배출하는 시설물 및 방지시설, 오염물질 발생량 (오염물질 종류), 연료 및 원료 사용량, 배출계수 발생량 정리
    3. 보기 쉽게 위의 내용들 배치
 
    `
  }

  if (docName == "유형자산관리대장") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 환경 오염을 유발하는 자산들 매핑
      3. 온실가스를 줄이기 위한 환경 친화적인, 친환경적인 자산(ex.태양광패널 등) 매핑
    `
  }


  if (docName == "차량관리대장") {
    instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 필요없는 보험등과 같은 부가서비스는 무시(보여주지마)
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
            각 ${docName} 별로 주어진 ${instruction}을 수행해
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




