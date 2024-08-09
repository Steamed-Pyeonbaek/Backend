import OpenAI from "openai";

class Postprocessor {
  private apiKey = process.env.UPSTAGE_API_KEY as string;
  private openai: any | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://api.upstage.ai/v1/solar",
    });
  }

  public async classify(list: any[]) {
    const ret: any[] = [];

    for (const item of list) {
      const result = await this.openai.chat.completions.create({
        model: "solar-1-mini-chat",
        messages: [
          {
            role: "system",
            content: `
                <Context>
                    너는 지금부터 주어진 거래내역을 보고 분류하는 전문가야.
                </Context>
        
                <Instructions>
                    거래내역을 보고 다음 중 어떤 내역인지 무조건 하나만 말해. 무조건 단어만 말해. 그리고 가격을 포함해서 말해.
                        1. 유류비
                        2. 전기료
                        3. 가스비
                        4. 통신비

                    예시: "[유류비, 100000]"
                </Instructions>
                `,
          },
          {
            role: "user",
            content: item,
          },
        ],
      });

      const classified = result.choices[0].message.content;

      //   console.log(classified);
      result.push(classified);
    }

    return ret;
  }
}

const classifier = new Postprocessor();

export default classifier;
