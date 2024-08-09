import { put } from "@vercel/blob";

/** 파일, 이미지 업로드를 위한 클래스 */
class StorageUtil {
  // private key: string | null = null;

  //   constructor() {
  //     this.key = process.env.BLOB_READ_WRITE_TOKEN as string;
  //   }

  /** 파일, 이미지를 업로드합니다. */
  public async uploadFile(file: File): Promise<string> {
    const name = file.name;
    const date = new Date().toLocaleString();

    if (name.includes(".txt")) {
      const { url } = await put(`docs/txt_${name}_${date}}`, file, {
        access: "public",
      });
      return url;
    } else if (
      name.includes(".jpg") ||
      name.includes(".jpeg") ||
      name.includes(".png")
    ) {
      const { url } = await put(`docs/img_${name}_${date}`, file, {
        access: "public",
      });
      return url;
    }

    throw new Error("지원하지 않는 파일 형식입니다.");
  }
}

const storageUtil = new StorageUtil();

/** 파일, 이미지 업로드를 위한 클래스의 객체입니다. 해당 객체를 사용하여 파일, 이미지 업로드를 진행합니다. */
export default storageUtil;
