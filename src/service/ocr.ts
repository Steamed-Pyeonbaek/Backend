class OCR {

    private apiKey = process.env.UPSTAGE_API_KEY as string;

    constructor() {

    }

    public async read(image: File) {
        // 클라이언트에서 보내온 FormData를 가져옵니다.
        //   const formData = await req.formData();
        //   const file = formData.get("document") as File;
        // const type = formData.get("type") as string
        if (!image) {
            return {
                message: "파일 X"
            }
        }

        try {
            // FormData를 사용하여 파일을 외부 API에 전송합니다.
            const externalFormData = new FormData();
            externalFormData.append("document", image);

            const res = await fetch("https://api.upstage.ai/v1/document-ai/ocr", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    // 'Content-Type': 'multipart/form-data'는 자동으로 설정되므로 제거합니다.
                },
                body: externalFormData
            });

            if (!res.ok) {
                throw new Error(`서버 응답 오류: ${res.status}`);
            }

            const testResult = await res.json();
            return {
                message: testResult
            }
        } catch (error) {
            console.error("서버 처리 오류:", error);
            return {
                message: "파일 처리에 실패했습니다."
            }
        }
    }
}

const ocr = new OCR()

export default ocr