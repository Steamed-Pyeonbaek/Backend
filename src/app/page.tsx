"use client"
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  const [data, setData] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [toggle, setToggle] = useState(false)

  const addFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.error("파일을 선택해 주세요.");
      return;
    }

    setData(file);

    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await fetch("/api/v1/calc", {
        method: "POST",
        body: formData // FormData를 직접 전송합니다.
      });

      if (!res.ok) {
        throw new Error("서버 응답이 올바르지 않습니다.");
      }

      const result = await res.json();
      setResult(JSON.stringify(result.message, null, 2)); // JSON 문자열로 변환하여 상태 업데이트
      console.log(result.message);

    } catch (error) {
      console.error("파일 업로드 오류:", error);
      setResult("파일 업로드에 실패했습니다.");
    }
  };

  const toggleBar = () => {
    setToggle((t) => !t)
  }

  return (
    <div className="container">
      <div className="step">
        <h2>STEP 1</h2>
        <h2>조직 경계 문서 업로드</h2>
        <p>조직경계 지정을 위해 사업자 등록증, 등기부등본, 임대차 계약서, 인수인계 계약서, 배출시설 설치허가증, 유해화학물질 영업허가증, 유형자산관리대장, 시설배치도, 차량관리대장 서류를 업로드 해주세요 (조직 경계에 포함된다고 생각하는 문서 제출) </p>
        <div className="file-upload">
          <input onChange={addFile} type="file" accept="image/*" id="fileInput" />
          {data ? (
            <Image src={URL.createObjectURL(data)} width={200} height={200} alt="NONE" />
          ) : (
            <>
              <label htmlFor="fileInput">문서파일 업로드</label>
              <label htmlFor="fileInput">문서를 우스로 끌어오거나, 클릭해 업로드 해주세요</label>
            </>
          )}
        </div>
      </div>

      {toggle ? (
        <pre onClick={toggleBar} className="bg-gray-300 text-wrap p-8 cursor-pointer">
          {result}
        </pre>
      ) : (
        <button onClick={toggleBar} className="w-full bg-gray-300 h-12 text-end pr-4">
          펼치기
        </button>
      )}

      <div className="step">
        <h2>STEP 2</h2>
        <h2>오픈뱅킹 API 연동 정보 입력</h2>
        <p>자동 탄소배출현황 확인을 위해 정보 법인통장 내역을 확인합니다</p>
        <div className="form-group">
          <label htmlFor="bankApiKey">은행거래고유번호</label>
          <input type="text" id="bankApiKey" placeholder="은행거래고유번호 (20자리)" />
        </div>
        <div className="form-group">
          <label htmlFor="corporateId">핀테크이용번호</label>
          <input type="text" id="corporateId" placeholder="핀테크이용번호 (24자리)" />
        </div>
      </div>

      <button type="submit" className="submit-btn">보고서 생성하기</button>
    </div>
  );
}