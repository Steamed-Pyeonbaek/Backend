import Image from "next/image";

export default function Home() {
  return (
    <div className="container">
    <div className="step">
      <h2>STEP 1</h2>
      <h2>조직 경계 문서 업로드</h2>
      <p>조직경계 지정을 위해 사업자 등록증, 등기부등본, 임대차 계약서, 인수인계 계약서, 배출시설 설치허가증, 유해화학물질 영업허가증, 유형자산관리대장, 시설배치도, 차량관리대장 서류를 업로드 해주세요 (조직 경계에 포함된다고 생각하는 문서 제출) </p>
      <div className="file-upload">
        <input type="file" id="fileInput" />
        <label htmlFor="fileInput">문서파일 업로드</label>
        <label htmlFor="fileInput">문서를 우스로 끌어오거나, 클릭해 업로드 해주세요</label>
      </div>
    </div>

    <div className="step">
      <h2>STEP 2</h2>
      <h2>오픈뱅킹 API 연동 정보 입력</h2>
      <p>자동 탄소배출현황 확인을 위해 정보 법인통장 내역을 확인합니다</p>
      <div className="form-group">
        <label htmlFor="bankApiKey">은행계좌 API 인증정보</label>
        <input type="text" id="bankApiKey" placeholder="은행계좌인증정보 (20자리)" />
      </div>
      <div className="form-group">
        <label htmlFor="corporateId">법인등록번호</label>
        <input type="text" id="corporateId" placeholder="법인등록번호 (24자리)" />
      </div>
    </div>

    <button type="submit" className="submit-btn">보고서 생성하기</button>
  </div>
  );
}
