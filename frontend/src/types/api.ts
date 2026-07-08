/** Formato padrão de erro retornado pelo GlobalExceptionHandler do backend. */
export interface ApiFieldError {
  campo: string;
  mensagem: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errors?: ApiFieldError[];
}

/** Erro lançado pelo cliente HTTP quando a resposta não é 2xx. */
export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorResponse;

  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
