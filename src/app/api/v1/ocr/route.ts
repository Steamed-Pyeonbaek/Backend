// "openai": "^4.21.0"(https://github.com/openai/openai-node)

import { NextResponse } from "next/server";
import OpenAI from "openai";


export async function POST(req: Request) {
    const { prompt } = await req.json()

    const apiKey = process.env.UPSTAGE_API_KEY
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.upstage.ai/v1/solar'
    })
    
    const chatCompletion = await openai.chat.completions.create({
      model: 'solar-1-mini-chat',
      messages: [
        {
            role: "system",
            content: "Have fun conversation with user"
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    //   stream: true
    });
    
    // for await (const chunk of chatCompletion) {
    //   console.log(chunk.choices[0]?.delta?.content || '');
    // }

    return NextResponse.json({
        message: chatCompletion.choices[0].message.content
    })
    
    // Use with stream=false
    // console.log(chatCompletion.choices[0].message.content || '');

}