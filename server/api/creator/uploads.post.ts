import { success, error } from "~~/server/utils/result";
import { requireCreator } from "~~/server/utils/permission";
import { uploadToR2, getR2PublicUrl } from "~~/server/utils/r2";
import { randomUUID } from "crypto";

export default defineEventHandler(async (event) => {
  try {
    await requireCreator(event);
    const formData = await readMultipartFormData(event);

    if (!formData || !formData.length) {
      return error("请上传图片文件");
    }

    const fileField = formData.find((field) => field.type === "file");

    if (!fileField || !fileField.data) {
      return error("未找到有效的文件");
    }

    const buffer = Buffer.isBuffer(fileField.data)
      ? fileField.data
      : Buffer.from(fileField.data);

    const filename = fileField.filename || `${Date.now()}.png`;
    const ext = filename.includes(".") ? filename.split(".").pop() : "png";
    const safeExt = (ext || "png").toLowerCase();
    const uniqueName = `${Date.now()}-${randomUUID()}.${safeExt}`;
    const objectKey = `origin/${uniqueName}`;

    await uploadToR2(
      buffer,
      objectKey,
      fileField.type || "application/octet-stream"
    );

    return success(
      {
        url: getR2PublicUrl(uniqueName, "origin"),
        key: objectKey,
        name: uniqueName,
        mimeType: fileField.type,
        size: buffer.length,
      },
      "上传成功"
    );
  } catch (err: any) {
    return error(err.message || "上传失败");
  }
});
