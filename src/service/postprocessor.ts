import * as math from "mathjs";
import { ChatOpenAI, OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

class Postprocessor {
  private apiKey: string = process.env.UPSTAGE_API_KEY as string;
  private apiKeyOpenAI: string = process.env.OPENAI_API_KEY as string;
  private openai: OpenAI;
  private baseUri: string = "https://api.upstage.ai/v1/solar";

  constructor() {
    this.openai = new OpenAI({
      apiKey: this.apiKeyOpenAI,
      temperature: 0,
    });
  }

  public async extract(inputPrompt: string): Promise<string> {
    const classified = await this.classifyDocument(inputPrompt);
    const docName = this.getDocumentName(classified);
    const instruction = this.getExtractionInstruction(docName);
    const promptTemplate = this.createPromptTemplate(docName, instruction);

    const input = await promptTemplate.invoke({ query: inputPrompt });
    const response = await this.openai.invoke(input.toChatMessages());

    return response;
  }

  public async classify(list: any[]): Promise<string> {
    const response = await fetch(`${this.baseUri}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "solar-1-mini-chat",
        messages: [
          {
            role: "system",
            content: `
              <Context>
                  너는 지금부터 주어진 거래내역을 보고 분류하는 전문가야.
              </Context>
              <Instructions>
                  내역의 전체 리스트 요소 하나하나를 보고 분류하고 가격을 써.
                    1. 유류비
                    2. 전기료
                    3. 가스비
                    4. 통신비
                  예시: [[유류비, 100000], [전기료, 200000], [가스비, 300000], [통신비, 400000]]
              </Instructions>
              `,
          },
          {
            role: "user",
            content: JSON.stringify(list),
          },
        ],
      }),
    });

    const result = await response.json();
    return result.choices[0].message.content;
  }

  public async calculate(paid: string, ocr: string): Promise<number> {
    const expression = await this.generateMathExpression(ocr);
    return math.evaluate(expression);
  }

  private async classifyDocument(inputPrompt: string): Promise<any> {
    const response = await fetch(`${this.baseUri}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "solar-1-mini-chat",
        messages: [
          {
            role: "system",
            content: `
              <Context>
                너는 지금부터 주어진 공공문서를 보고 분류하는 전문가야.
              </Context>
              <Instructions>
                문서의 종류는? 다음 중 하나를 선택해:
                  1. 건축물관리대장
                  2. 차량관리대장
                *** 중요 ***: 앞의 인덱스 번호만 써
              </Instructions>
            `,
          },
          {
            role: "user",
            content: inputPrompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    return await response.json();
  }

  private getDocumentName(classified: any): string {
    const docClasses = ["건축물관리대장", "차량관리대장"];
    const idx = parseInt(classified.choices[0].message.content);
    return docClasses[idx - 1];
  }

  private getExtractionInstruction(docName: string): string {
    switch (docName) {
      case "건축물관리대장":
        return `
          1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
        `;
      case "차량관리대장":
        return `
          1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
          2. 필요없는 보험등과 같은 부가서비스는 무시
          3. 절대로 이외의 부연설명은 금지
          4. 표로 정리
          5. "주행거리" 열을 무조건 표시
          6. 날짜마다 표시된 주행거리는 전날까지의 누적 주행거리
          *** 중요 ***: 열 제목과 내용이 맞도록 재구성
        `;
      default:
        return `
          1. 각 공공문서를 보고 온실가스 배출량을 계산할때 필요한 정보들을 추출
          2. 불필요한 정보를 제거
          3. 관련이 있는 정보들끼리 매핑
          4. 부가적인 설명&참고는 생략
          5. 필요없는 괄호는 생략/ 가시적으로 보여줘
        `;
    }
  }

  private createPromptTemplate(
    docName: string,
    instruction: string
  ): PromptTemplate {
    return PromptTemplate.fromTemplate(
      `
        너는 지금부터 주어진 ${docName}를 보고 있는 그대로 추출하는 전문가야.
        각 ${docName} 별로 주어진 ${instruction}을 수행해:
        {query}
      `
    );
  }

  private async generateMathExpression(query: string): Promise<string> {
    const promptTemplate = PromptTemplate.fromTemplate(
      `For {query}, Write only the mathematical expression suitable for evaluation to calculate with "math.evaluate()". Refer to 온실가스 배출량 = Σ[((총 주행 거리 - 제외 주행 거리) * 연료 소비 비율) * 발열량 (41.868) * 탄소 계수 * 배출 계수 * 산화 계수 * 44/12 * 10^(-3)].
      *** IMPORTANT ***: OUTPUT IS ONLY THE MATHEMATICAL EXPRESSION. DO NOT INCLUDE ANYTHING ELSE.
      *** INFO ***: 날짜마다 표시된 주행거리는 전날까지의 누적 주행거리. 따라서 총 주행거리는 마지막 날짜의 주행거리에서 첫날 기준 주행거리를 빼서 계산해야 함.
      ex) (140-0)*1*41.868*1*1*44/12*10^(-3))
      `
    );

    const input = await promptTemplate.invoke({ query: query });
    const response = await this.openai.invoke(input.toChatMessages());
    return response;
  }
}

const postProcessor = new Postprocessor();

export default postProcessor;
