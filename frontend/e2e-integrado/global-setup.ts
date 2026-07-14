import { E2E_API_BASE_URL } from "./helpers/backendApi";

/**
 * TASK-104: falha rápido e com mensagem clara se o backend real não estiver de pé, em vez de deixar
 * cada teste estourar timeout tentando falar com uma porta fechada. O E2E integrado nunca sobe o
 * backend sozinho (ver frontend/README.md seção "E2E integrado") — só confirma que já está no ar.
 */
export default async function globalSetup(): Promise<void> {
  const healthUrl = `${E2E_API_BASE_URL}/actuator/health`;
  try {
    const response = await fetch(healthUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Backend real não respondeu em ${healthUrl} (${motivo}). O E2E integrado (TASK-104) exige o ` +
        `backend rodando localmente com JWT_SECRET/CORS_ALLOWED_ORIGINS/bootstrap de SUPER_ADMIN ` +
        `configurados antes de "npm run e2e:integrado" — ver frontend/README.md seção "E2E integrado".`,
    );
  }
}
