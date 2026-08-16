import { NextResponse } from "next/server";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function apiSuccess<T>(data: T, init?: number) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status: init ?? 200 });
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json<ApiErrorBody>(
    { success: false, error: { code, message } },
    { status }
  );
}
