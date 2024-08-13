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

  public async extract(inputPrompt: string): Promise<{
    extracted: any;
    formula: string;
    info: string;
  }> {
    const classified = await this.classifyDocument(inputPrompt);
    const docName = this.getDocumentName(classified);
    const instruction = this.getExtractionInstruction(docName);

    const formula = this.getFormula(docName);
    const info = this.getInfo(docName);

    const promptTemplate = this.createPromptTemplate(docName, instruction);

    const input = await promptTemplate.invoke({ query: inputPrompt });
    const extracted = await this.openai.invoke(input.toChatMessages());

    return { extracted, formula, info };
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
    const { formula, info, extracted } = await this.extract(ocr);

    console.log(extracted);

    const expression = await this.generateMathExpression(
      extracted,
      formula,
      info
    );

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
                  3. 등기부등본
                  4. 임대차계약서
                  5. 인수인계계약서
                  6. 배출시설 허가증
                  7. 유형자산 관리대장
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
    const docClasses = ["건축물관리대장", "차량관리대장","등기부등본","임대차계약서","인수인계계약서","배출시설 허가증", "유형자산 관리대장"];
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
      // 5. "주행거리" 열만 추출하여 표시
      //           5. "주행거리" 열을 무조건 표시
      case "등기부등본":
        return `
          1. 건물 면적 및 에너지 사용량 추출
          2. 에너지 소스별 사용량과 배출 계수 추출
        `;
      case "임대차계약서":
        return `
          1. 임대된 면적 및 해당 에너지 사용량 추출
        `;
      case "인수인계계약서":
        return `
          1. 이전 소유자 및 현재 소유자의 에너지 사용량 비교
        `;
      case "배출시설 허가증":
        return `
          1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
          2. 필요없는 보험등과 같은 부가서비스는 무시
          3. 절대로 이외의 부연설명은 금지
          4. 표로 정리
        `;
      case "유형자산 관리대장":
        return `
          1. 유형자산의 에너지 소비량 및 배출 계수 추출
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
        <Context>
        너는 지금부터 주어진 ${docName}를 보고 있는 그대로 추출하는 전문가야.
        </Context>

        <Instructions>
        ${instruction}
        </Instructions>

        {query}
      `
    );
  }

  private getFormula(docName: string): string {
    switch (docName) {
        case "건축물관리대장":
            return `
            온실가스 배출량 = (건물의 총 에너지 사용량 * 에너지 소스별 배출 계수) * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (5000 * 전기 배출 계수) * 1 * 1 * 44/12 * 10^(-3)
            `;
        case "차량관리대장":
            return `
            온실가스 배출량 = ((총 주행 거리 - 제외 주행 거리) * 연료 소비 비율) * 발열량 (41.868) * 탄소 계수 * 배출 계수 * 산화 계수 * 44/12 * 10^(-3) 
            예시: (140-0)*1*41.868*1*1*44/12*10^(-3)
            `;
        case "등기부등본":
            return `
            온실가스 배출량 = (건물의 면적 * 에너지 사용량 * 에너지 소스별 배출 계수) * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (200 * 150 * 전기 배출 계수) * 1 * 1 * 44/12 * 10^(-3)
            `;
        case "임대차계약서":
            return `
            온실가스 배출량 = (임대된 면적 * 에너지 사용량) * 배출 계수 * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (100  * 200  * 전기 배출 계수) * 1 * 1 * 44/12 * 10^(-3)
            `;
        case "인수인계계약서":
            return `
            온실가스 배출량 = (이전 소유자와 현재 소유자의 에너지 사용량 차이) * 배출 계수 * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (현재 3000 - 이전 2500 ) * 배출 계수 * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            `;
        case "배출시설 허가증":
            return `
            온실가스 배출량 = (허가된 배출량 * 시설의 사용 시간) * 배출 계수 * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (1000 * 10) * 배출 계수 * 1 * 1 * 44/12 * 10^(-3)
            `;
        case "유형자산 관리대장":
            return `
            온실가스 배출량 = (유형자산의 에너지 소비량 * 에너지 소스별 배출 계수) * 탄소 계수 * 산화 계수 * 44/12 * 10^(-3)
            예시: (장비 A의 2000  * 전기 배출 계수) * 1 * 1 * 44/12 * 10^(-3)
            `;
        default:
            return `
            해당 문서에 대한 온실가스 배출 공식이 없습니다.
            `;
    }
}

private getInfo(docName: string): string {
    switch (docName) {
        case "건축물관리대장":
            return `
            건축물의 총 에너지 사용량은 전기, 가스, 연료 등 다양한 에너지 소스에 대한 사용량을 합산한 값임.
            각 에너지 소스별 배출 계수를 사용하여 계산.
            `;
        case "차량관리대장":
            return `
            날짜마다 표시된 주행거리는 전날까지의 누적 주행거리 값임.
            따라서 총 주행거리는 마지막 날짜의 주행거리에서 첫날 기준 주행거리를 빼서 계산해야 함.
            예시:
                주행거리
                12,000  
                12,200 
                12,500 
                12,550 
                12,700
            총 주행거리 = 12,700 - 12,000
            `;
        case "등기부등본":
            return `
            건물의 면적과 에너지 사용량을 기반으로 계산하며, 에너지 소스별로 별도의 배출 계수를 사용함.
            건물의 구조 및 사용 목적에 따라 에너지 소비량이 달라질 수 있음.
            `;
        case "임대차계약서":
            return `
            임대된 면적과 해당 면적에서 사용된 에너지 소비량을 기준으로 온실가스 배출량을 산출.
            계약서에서 임대 면적과 관련된 에너지 사용량을 확인할 필요가 있음.
            `;
        case "인수인계계약서":
            return `
            이전 소유자와 현재 소유자의 에너지 사용량 차이를 기반으로 계산.
            인수인계 과정에서 에너지 사용량의 변동을 반영하여 배출량을 계산해야 함.
            `;
        case "배출시설 허가증":
            return `
            허가된 배출량과 실제 사용 시간을 기반으로 계산.
            허가증에 명시된 허용 배출량과 시설의 사용 시간에 따라 배출량이 달라질 수 있음.
            `;
        case "유형자산 관리대장":
            return `
            유형자산의 에너지 소비량을 기반으로 배출량을 계산하며, 각 자산별 에너지 소스에 따라 배출 계수가 다름.
            자산의 사용 시간과 에너지 효율에 따라 온실가스 배출량이 달라질 수 있음.
            `;
        default:
            return `
            해당 문서에 대한 정보가 없습니다.
            `;
    }
}


  // formula: 온실가스 배출량 = Σ[((총 주행 거리 - 제외 주행 거리) * 연료 소비 비율) * 발열량 (41.868) * 탄소 계수 * 배출 계수 * 산화 계수 * 44/12 * 10^(-3)] / example (140-0)*1*41.868*1*1*44/12*10^(-3))
  // info: 날짜마다 표시된 주행거리는 전날까지의 누적 주행거리. 따라서 총 주행거리는 마지막 날짜의 주행거리에서 첫날 기준 주행거리를 빼서 계산해야 함.
  private async generateMathExpression(
    query: string,
    formula: string,
    info: string
  ): Promise<string> {
    const promptTemplate = PromptTemplate.fromTemplate(
      `For {query}, Write only the mathematical expression suitable for evaluation to calculate with "math.evaluate()". Refer to {formula}.
      *** IMPORTANT ***: OUTPUT IS ONLY THE MATHEMATICAL EXPRESSION. DO NOT INCLUDE ANYTHING ELSE, EVEN QUOTES.
      *** INFO ***: {info}
      `
    );

    const input = await promptTemplate.invoke({
      query: query,
      formula: formula,
      info: info,
    });

    const response = await this.openai.invoke(input.toChatMessages());

    console.log(response);

    return response;
  }
}

const postProcessor = new Postprocessor();

export default postProcessor;
