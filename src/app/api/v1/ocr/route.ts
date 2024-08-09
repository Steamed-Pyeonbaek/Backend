// "openai": "^4.21.0"(https://github.com/openai/openai-node)

import { NextResponse } from "next/server";
import OpenAI from "openai";


export async function POST(req: Request) {
    const img = await req.blob()

    const apiKey = process.env.UPSTAGE_API_KEY as string
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.upstage.ai/v1/solar'
    })

    console.log(img)

    const newFormData = new FormData()

    newFormData.append("document", img)

    // const formData = 

    const res = await fetch("https://api.upstage.ai/v1/document-ai/ocr", {
        method: "POST",
        headers: {
            // 'Content-Type': 'application/json',
            // 'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
            
            "Authorization": `Bearer ${apiKey}`,
            //파일 이름만 있는 상태인데 이를 파일 데이터도 같이 보내게끔 해야함
        },
        body: JSON.stringify({
            body: newFormData
        })
    })

    // const chatCompletion = await openai.chat.completions.create({
    //   model: 'solar-1-mini-chat',
    //   messages: [
    //     {
    //         role: "system",
    //         content: "Have fun conversation with user"
    //     },
    //     {
    //       role: 'user',
    //       content: prompt
    //     }
    //   ],
    // //   stream: true
    // });

    // for await (const chunk of chatCompletion) {
    //   console.log(chunk.choices[0]?.delta?.content || '');
    // }

    const testResult = await res.json()
    // console.log(res)

    return NextResponse.json({
        message: testResult
    })

    // Use with stream=false
    // console.log(chatCompletion.choices[0].message.content || '');

}