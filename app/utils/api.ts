import type { Result } from "~~/utils/models";

/**
 * API 请求配置选项
 */
export interface ApiOptions {
  /** 请求参数（用于 GET 请求） */
  query?: Record<string, any>;
  /** 请求体（用于 POST/PUT/PATCH 请求） */
  body?: any;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 是否返回原始响应（不解析 Result 包装） */
  raw?: boolean;
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(public code: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 统一请求方法
 */
async function request<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  options: ApiOptions = {}
): Promise<T> {
  try {
    const { query, body, headers = {}, raw } = options;

    const response = await $fetch<Result<T>>(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      query,
      body,
      credentials: "include",
    });

    if (raw) {
      return response as any;
    }

    if (response.c === 200) {
      return response.d;
    }

    throw new ApiError(response.c, response.m || "请求失败", response.d);
  } catch (error: any) {
    console.error("API 请求失败:", error);
    throw error;
  }
}

/**
 * API 工具类
 */
export const api = {
  /** GET 请求 */
  get<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
    return request<T>(url, "GET", options);
  },

  /** POST 请求 */
  post<T = any>(url: string, body?: any, options: ApiOptions = {}): Promise<T> {
    return request<T>(url, "POST", { ...options, body });
  },

  /** PUT 请求 */
  put<T = any>(url: string, body?: any, options: ApiOptions = {}): Promise<T> {
    return request<T>(url, "PUT", { ...options, body });
  },

  /** PATCH 请求 */
  patch<T = any>(
    url: string,
    body?: any,
    options: ApiOptions = {}
  ): Promise<T> {
    return request<T>(url, "PATCH", { ...options, body });
  },

  /** DELETE 请求 */
  delete<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
    return request<T>(url, "DELETE", options);
  },

  /** 文件上传 */
  async upload<T = any>(
    url: string,
    formData: FormData,
    options: ApiOptions = {}
  ): Promise<T> {
    try {
      const { query, headers = {}, raw } = options;

      const response = await $fetch<Result<T>>(url, {
        method: "POST",
        headers,
        query,
        body: formData,
        credentials: "include",
      });

      if (raw) {
        return response as any;
      }

      if (response.c === 200) {
        return response.d;
      }

      throw new ApiError(response.c, response.m || "业务失败", response.d);
    } catch (error: any) {
      console.error("文件上传失败:", error);
      throw error;
    }
  },

  /** 文件下载 */
  async download(
    url: string,
    filename?: string,
    options: ApiOptions = {}
  ): Promise<void> {
    try {
      const { query, headers = {} } = options;

      const blob = await $fetch<Blob>(url, {
        method: "GET",
        headers,
        query,
        credentials: "include",
        responseType: "blob",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error: any) {
      console.error("文件下载失败:", error);
      throw error;
    }
  },
};

export default api;
