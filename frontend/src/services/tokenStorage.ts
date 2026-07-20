import type {
  AtivarDispositivoResponse,
  DispositivoAutenticadoResponse,
  LoginResponse,
  OperadorAutenticadoResponse,
  OperadorLoginResponse,
  RefreshResponse,
  UsuarioAutenticadoResponse,
} from "../types/auth";

/**
 * Armazenamento de sessão em localStorage, com três contextos fisicamente
 * separados por prefixo de chave — usuário humano, dispositivo (Totem/Caixa/
 * Cozinha/Administração) e operador. Antes desta refatoração (auditoria de
 * autenticação, achado 8.5), `totem.accessToken`/`totem.refreshToken` eram
 * compartilhados entre usuário e dispositivo, com a exclusividade garantida
 * apenas por convenção de código — um login administrativo podia sobrescrever
 * silenciosamente a sessão de um terminal no mesmo navegador. Agora cada
 * contexto tem seu próprio par de tokens, sem nenhuma chave em comum.
 *
 * Não armazena senha nem qualquer dado sensível além dos tokens de acesso/
 * renovação e dos campos mínimos de dispositivo/usuário/operador necessários
 * para a UI.
 */
const USER_ACCESS_TOKEN_KEY = "totem.user.accessToken";
const USER_REFRESH_TOKEN_KEY = "totem.user.refreshToken";
const USER_DATA_KEY = "totem.user.data";

const DEVICE_ACCESS_TOKEN_KEY = "totem.device.accessToken";
const DEVICE_REFRESH_TOKEN_KEY = "totem.device.refreshToken";
const DEVICE_DATA_KEY = "totem.device.data";

const OPERATOR_ACCESS_TOKEN_KEY = "totem.operator.accessToken";
const OPERATOR_DATA_KEY = "totem.operator.data";

// Chaves antigas (compartilhadas entre usuário e dispositivo) — mantidas só
// para a migração em runMigrationOnce(). Podem ser removidas deste arquivo
// junto com runMigrationOnce()/migrateLegacyKeys() assim que se confirmar
// que nenhum navegador em produção ainda tem sessão salva no formato antigo
// (sugestão: remover após um ciclo de deploy completo sem relatos de sessão
// perdida, ou de acordo com a política de suporte a sessões do projeto).
const LEGACY_ACCESS_TOKEN_KEY = "totem.accessToken";
const LEGACY_REFRESH_TOKEN_KEY = "totem.refreshToken";
const LEGACY_DEVICE_DATA_KEY = "totem.dispositivo";
const LEGACY_USER_DATA_KEY = "totem.usuario";
const LEGACY_OPERATOR_ACCESS_TOKEN_KEY = "totem.operadorToken";
const LEGACY_OPERATOR_DATA_KEY = "totem.operador";

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sessão de usuário humano (SUPER_ADMIN, ADMIN_RESTAURANTE, operadores logados
// via /login antes de entrar em Caixa/Cozinha).
// ---------------------------------------------------------------------------

export function getUserAccessToken(): string | null {
  return localStorage.getItem(USER_ACCESS_TOKEN_KEY);
}

export function getUserRefreshToken(): string | null {
  return localStorage.getItem(USER_REFRESH_TOKEN_KEY);
}

export function getStoredUsuario(): UsuarioAutenticadoResponse | null {
  return readJson<UsuarioAutenticadoResponse>(USER_DATA_KEY);
}

function setStoredUsuario(usuario: UsuarioAutenticadoResponse): void {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(usuario));
}

/** Salva a sessão de usuário humano a partir de POST /api/auth/login. Não afeta a sessão de dispositivo. */
export function saveUserSession(response: LoginResponse): void {
  localStorage.setItem(USER_ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(USER_REFRESH_TOKEN_KEY, response.refreshToken);
  setStoredUsuario(response.usuario);
}

/** Atualiza a sessão de usuário após a rotação automática de refresh (contexto USER). */
export function saveRefreshedUserSession(response: RefreshResponse): boolean {
  if (!response.usuario) {
    return false;
  }
  localStorage.setItem(USER_ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(USER_REFRESH_TOKEN_KEY, response.refreshToken);
  setStoredUsuario(response.usuario);
  return true;
}

/** Limpa somente a sessão de usuário. Não apaga sessão de dispositivo nem de operador. */
export function clearUserSession(): void {
  localStorage.removeItem(USER_ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
}

// ---------------------------------------------------------------------------
// Sessão de dispositivo (Totem/Caixa/Cozinha/Administração ativados via
// /ativar-dispositivo).
// ---------------------------------------------------------------------------

export function getDeviceAccessToken(): string | null {
  return localStorage.getItem(DEVICE_ACCESS_TOKEN_KEY);
}

export function getDeviceRefreshToken(): string | null {
  return localStorage.getItem(DEVICE_REFRESH_TOKEN_KEY);
}

export function getStoredDispositivo(): DispositivoAutenticadoResponse | null {
  return readJson<DispositivoAutenticadoResponse>(DEVICE_DATA_KEY);
}

function setStoredDispositivo(dispositivo: DispositivoAutenticadoResponse): void {
  localStorage.setItem(DEVICE_DATA_KEY, JSON.stringify(dispositivo));
}

/** Salva a sessão de dispositivo a partir de POST /api/auth/dispositivos/ativar. Não afeta a sessão de usuário. */
export function saveDeviceSession(response: AtivarDispositivoResponse): void {
  localStorage.setItem(DEVICE_ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(DEVICE_REFRESH_TOKEN_KEY, response.refreshToken);
  setStoredDispositivo(response.dispositivo);
  // Dispositivo recém-ativado (ou reativado) não deveria herdar o operador identificado
  // no terminal anterior — evita que uma auditoria de ações fique associada ao operador errado.
  clearOperadorSession();
}

/** Atualiza a sessão de dispositivo após a rotação automática de refresh (contexto DEVICE). */
export function saveRefreshedDeviceSession(response: RefreshResponse): boolean {
  if (!response.dispositivo) {
    return false;
  }
  localStorage.setItem(DEVICE_ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(DEVICE_REFRESH_TOKEN_KEY, response.refreshToken);
  setStoredDispositivo(response.dispositivo);
  return true;
}

/** Limpa somente a sessão de dispositivo. Não apaga sessão de usuário. */
export function clearDeviceSession(): void {
  localStorage.removeItem(DEVICE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(DEVICE_REFRESH_TOKEN_KEY);
  localStorage.removeItem(DEVICE_DATA_KEY);
}

// ---------------------------------------------------------------------------
// Sessão de operador (TASK-092) — identificação complementar dentro de uma
// sessão de dispositivo CAIXA/COZINHA já ativa. Token curto, sem refresh,
// nunca reaproveita as chaves de usuário/dispositivo.
// ---------------------------------------------------------------------------

export function getOperadorToken(): string | null {
  return localStorage.getItem(OPERATOR_ACCESS_TOKEN_KEY);
}

export function getOperador(): OperadorAutenticadoResponse | null {
  return readJson<OperadorAutenticadoResponse>(OPERATOR_DATA_KEY);
}

/** Salva a sessão de operador. Substitui apenas uma sessão de operador anterior — nunca toca USER/DEVICE. */
export function saveOperadorSession(response: OperadorLoginResponse): void {
  localStorage.setItem(OPERATOR_ACCESS_TOKEN_KEY, response.operadorToken);
  localStorage.setItem(OPERATOR_DATA_KEY, JSON.stringify(response.operador));
}

export function clearOperadorSession(): void {
  localStorage.removeItem(OPERATOR_ACCESS_TOKEN_KEY);
  localStorage.removeItem(OPERATOR_DATA_KEY);
}

// ---------------------------------------------------------------------------
// Limpeza combinada
// ---------------------------------------------------------------------------

/**
 * TASK-112: limpa a sessão operacional (dispositivo + operador) — usada ao trocar/reativar o
 * equipamento nas telas de Caixa/Cozinha, ou quando a sessão do dispositivo se mostra inválida/
 * expirada. Nunca remove a sessão de usuário, ainda que hoje as duas sessões normalmente não
 * coexistam no mesmo terminal físico — o nome explícito existe para deixar essa garantia clara.
 */
export function limparSessaoOperacionalCompleta(): void {
  clearDeviceSession();
  clearOperadorSession();
}

/** Limpa todas as sessões (usuário + dispositivo + operador). Uso: logout completo/reset de ambiente de teste. */
export function clearAllSessions(): void {
  clearUserSession();
  clearDeviceSession();
  clearOperadorSession();
}

// ---------------------------------------------------------------------------
// Migração das chaves antigas (compartilhadas) para o novo formato separado.
// Executa uma vez, de forma síncrona, na primeira importação deste módulo.
// ---------------------------------------------------------------------------

function migrateLegacyKeys(): void {
  const legacyAccessToken = localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  const legacyRefreshToken = localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY);
  const legacyUsuario = readJson<UsuarioAutenticadoResponse>(LEGACY_USER_DATA_KEY);
  const legacyDispositivo = readJson<DispositivoAutenticadoResponse>(LEGACY_DEVICE_DATA_KEY);
  const legacyOperadorToken = localStorage.getItem(LEGACY_OPERATOR_ACCESS_TOKEN_KEY);
  const legacyOperador = readJson<OperadorAutenticadoResponse>(LEGACY_OPERATOR_DATA_KEY);

  const haviaChaveAntiga =
    legacyAccessToken !== null ||
    legacyRefreshToken !== null ||
    legacyUsuario !== null ||
    legacyDispositivo !== null ||
    legacyOperadorToken !== null ||
    legacyOperador !== null;

  if (!haviaChaveAntiga) {
    return;
  }

  // O titular do par accessToken/refreshToken antigo era identificado por qual dos dois dados
  // (usuario XOR dispositivo) estava presente — a mesma invariante que o backend já garante em
  // RefreshResponse. Só migramos o par de tokens quando é possível determinar o titular com
  // segurança; caso contrário, descartamos os tokens em vez de arriscar migrá-los para o contexto
  // errado (ex.: um token de dispositivo virando token de usuário).
  if (legacyUsuario && !legacyDispositivo && legacyAccessToken && legacyRefreshToken) {
    localStorage.setItem(USER_ACCESS_TOKEN_KEY, legacyAccessToken);
    localStorage.setItem(USER_REFRESH_TOKEN_KEY, legacyRefreshToken);
    setStoredUsuario(legacyUsuario);
  } else if (legacyDispositivo && !legacyUsuario && legacyAccessToken && legacyRefreshToken) {
    localStorage.setItem(DEVICE_ACCESS_TOKEN_KEY, legacyAccessToken);
    localStorage.setItem(DEVICE_REFRESH_TOKEN_KEY, legacyRefreshToken);
    setStoredDispositivo(legacyDispositivo);
  }
  // Se havia ambos os dados (usuario e dispositivo) ou nenhum, o titular é ambíguo — os tokens
  // antigos são descartados sem migração; o usuário/dispositivo precisará autenticar de novo.

  if (legacyOperadorToken && legacyOperador) {
    localStorage.setItem(OPERATOR_ACCESS_TOKEN_KEY, legacyOperadorToken);
    localStorage.setItem(OPERATOR_DATA_KEY, JSON.stringify(legacyOperador));
  }

  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_DATA_KEY);
  localStorage.removeItem(LEGACY_DEVICE_DATA_KEY);
  localStorage.removeItem(LEGACY_OPERATOR_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_OPERATOR_DATA_KEY);
}

// Roda a migração uma única vez por carregamento do módulo (equivalente a "ao iniciar a
// aplicação", já que este módulo é importado antes de qualquer leitura de sessão).
migrateLegacyKeys();

/** Exposto só para os testes: permite re-executar a migração após popular localStorage manualmente. */
export function __runLegacyMigrationForTests(): void {
  migrateLegacyKeys();
}
