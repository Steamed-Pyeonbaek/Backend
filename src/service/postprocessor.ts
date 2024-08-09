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

  public async extract(inputPrompt: string) {
    const classified = await this.openai.chat.completions.create({
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
    });

    const docClasses = ["건축물관리대장", "차량관리대장"];

    const idx = parseInt(classified.choices[0].message.content);

    const docName: string = docClasses[idx - 1];

    console.log(docName);

    let instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 각 공공문서를 보고 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 불필요한 정보를 제거
      3. 관련이 있는 정보들끼리 매핑
      4. 부가적인 설명&참고는 생략
      5. 필요없는 괄호는 생략/ 가시적으로 보여줘
    `;

    if (docName.includes("건축물관리대장")) {
      instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
    `;
    }

    if (docName.includes("등기부등본")) {
      instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 우선 추출
    `;
    }

    if (docName.includes("배출시설 허가증")) {
      instruction = `
    추출을 다음 조건을 바탕으로 수행해:
    1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
    2. 대기배출 보고서의 경우 연료사용량, 오염물질 등을 배출하는 시설물 및 방지시설, 오염물질 발생량 (오염물질 종류), 연료 및 원료 사용량, 배출계수 발생량 정리
    3. 보기 쉽게 위의 내용들 배치

    `;
    }

    if (docName.includes("유형자산관리대장")) {
      instruction = `
    추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 환경 오염을 유발하는 자산들 매핑
      3. 온실가스를 줄이기 위한 환경 친화적인, 친환경적인 자산(ex.태양광패널 등) 매핑
    `;
    }

    if (docName.includes("차량관리대장")) {
      instruction = `
        추출을 다음 조건을 바탕으로 수행해:
      1. 온실가스 배출량을 계산할때 필요한 정보들을 추출
      2. 필요없는 보험등과 같은 부가서비스는 무시
      3. 절대로 이외의 부연설명은 금지
      4. 표로 정리
      5. "주행거리" 열을 무조건 표시
      `;
    }

    const chatCompletion = await this.openai.chat.completions.create({
      model: "solar-1-mini-chat",
      messages: [
        {
          role: "system",
          content: `
          <Context>
            너는 지금부터 주어진 ${docName}를 보고 있는 그대로 추출하는 전문가야.
            각 ${docName} 별로 주어진 ${instruction}을 수행해
          </Context>

          <Instructions>
            ${instruction}
          </Instructions>
        `,
        },
        {
          role: "user",
          content: inputPrompt,
        },
      ],
    });

    return chatCompletion.choices[0].message.content;
  }

  public async classify(list: any[]) {
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
    });

    return result.choices[0].message.content;
  }

  public async calculate(paid: string, ocr: string) {
    //     const formula = `온실가스 배출량 = Σ[((총 주행 거리 - 제외 주행 거리) * 연료 소비 비율) * 발열량 (41.868) * 탄소 계수 * 배출 계수 * 산화 계수 * 44/12 * 10^(-3)]
    // `;
    // 각 거래내역 별로 주어진 공식을 수행해

    const sum = await this.openai.chat.completions.create({
      model: "solar-1-mini-chat",
      messages: [
        {
          role: "system",
          content: `
          <Context>
            너는 지금부터 주어진 문서표를 보고 총 주행거리만 추출하는 전문가야.
          </Context>

          <Instructions>
            주행거리를 다음 규칙에 따라 추출해:
            1. 주행거리만 추출
            2. 숫자만 써
            3. 구분점은 "," 사용
            4. 다른 부가설명 금지

            ex) 100, 200, 300
          </Instructions>
        `,
        },
        {
          role: "user",
          content: ocr,
        },
      ],
    });

    const km = sum.choices[0].message.content;

    const list = km.split(",").map((e: string) => parseInt(e));

    console.log(list);

    const diff = list[list.length - 1] - list[0];

    console.log(diff);

    const E = (diff * 15 * 2.31 * 2.31 * 3.67) / 1000;

    return E;
  }
}

const postProcessor = new Postprocessor();

export default postProcessor;
