import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(
  message: string,
  code: string = 'BAD_REQUEST',
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function apiUnauthorized(message: string = 'Session expirée ou non authentifiée.') {
  return apiError(message, 'UNAUTHORIZED', 401);
}

export function apiForbidden(message: string = 'Permissions insuffisantes pour effectuer cette action.') {
  return apiError(message, 'FORBIDDEN', 403);
}

export function apiNotFound(message: string = 'Ressource introuvable.') {
  return apiError(message, 'NOT_FOUND', 404);
}

export function apiConflict(message: string = 'Conflit de données.') {
  return apiError(message, 'CONFLICT', 409);
}

export function apiServerError(message: string = 'Erreur interne du serveur atelier.') {
  return apiError(message, 'INTERNAL_SERVER_ERROR', 500);
}
