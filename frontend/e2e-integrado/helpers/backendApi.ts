import type { APIRequestContext } from "@playwright/test";
import type { AtivarDispositivoResponse, LoginResponse } from "../../src/types/auth";
import type { CriarCategoriaRequest, CategoriaAdminResponse } from "../../src/types/categoria";
import type { CriarDispositivoRequest, DispositivoAdminResponse } from "../../src/types/dispositivo";
import type { CriarProdutoRequest, ProdutoAdminResponse } from "../../src/types/produto";
import type { CriarRestauranteRequest, RestauranteAdminResponse } from "../../src/types/restaurante";

/**
 * Preparação de dados do E2E integrado (TASK-104) contra o backend REAL — sem mocks. Toda URL é
 * absoluta (`${E2E_API_BASE_URL}${path}`), então funciona independente do `baseURL` do Playwright
 * (que aqui aponta para o frontend, não o backend) e nunca passa pelo navegador — chamadas
 * server-to-server via `APIRequestContext`, não sujeitas a CORS (isso só importa para as chamadas
 * que o app faz de dentro do browser, feitas depois, na página).
 */
export const E2E_API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8080";

async function postJson<TResponse>(
  request: APIRequestContext,
  path: string,
  body: unknown,
  token?: string,
): Promise<TResponse> {
  const response = await request.post(`${E2E_API_BASE_URL}${path}`, {
    data: body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok()) {
    throw new Error(
      `POST ${path} falhou (HTTP ${response.status()}): ${await response.text()}. ` +
        `Confirme que o backend real está rodando com as variáveis descritas em frontend/README.md (seção "E2E integrado").`,
    );
  }
  return response.json() as Promise<TResponse>;
}

/** Sufixo único por execução — evita colidir com dados de execuções anteriores (sem depender de limpeza de banco). */
export function sufixoUnico(): string {
  return `E2E_${Date.now()}`;
}

/** 14 dígitos numéricos derivados do timestamp — satisfaz a validação de formato do backend (sem checksum real exigido) e é praticamente único por execução. */
export function cnpjUnico(): string {
  return Date.now().toString().padStart(14, "0").slice(-14);
}

export async function loginAdmin(request: APIRequestContext, email: string, senha: string): Promise<LoginResponse> {
  return postJson<LoginResponse>(request, "/api/auth/login", { email, senha });
}

export async function criarRestaurante(
  request: APIRequestContext,
  token: string,
  nome: string,
): Promise<RestauranteAdminResponse> {
  const body: CriarRestauranteRequest = { nome, cnpj: cnpjUnico() };
  return postJson<RestauranteAdminResponse>(request, "/api/admin/restaurantes", body, token);
}

export async function criarCategoria(
  request: APIRequestContext,
  token: string,
  restauranteId: number,
  nome: string,
): Promise<CategoriaAdminResponse> {
  const body: CriarCategoriaRequest = { restauranteId, nome };
  return postJson<CategoriaAdminResponse>(request, "/api/admin/categorias", body, token);
}

export async function criarProduto(
  request: APIRequestContext,
  token: string,
  restauranteId: number,
  categoriaId: number,
  nome: string,
  preco: number,
): Promise<ProdutoAdminResponse> {
  const body: CriarProdutoRequest = { restauranteId, categoriaId, nome, preco, disponivel: true };
  return postJson<ProdutoAdminResponse>(request, "/api/admin/produtos", body, token);
}

export async function criarDispositivo(
  request: APIRequestContext,
  token: string,
  restauranteId: number,
  nome: string,
  codigoIdentificacao: string,
): Promise<DispositivoAdminResponse> {
  const body: CriarDispositivoRequest = { restauranteId, nome, codigoIdentificacao, tipoDispositivo: "TOTEM" };
  return postJson<DispositivoAdminResponse>(request, "/api/admin/dispositivos", body, token);
}

/** POST /api/auth/dispositivos/ativar — endpoint público, sem token. */
export async function ativarDispositivo(
  request: APIRequestContext,
  codigoAtivacao: string,
): Promise<AtivarDispositivoResponse> {
  return postJson<AtivarDispositivoResponse>(request, "/api/auth/dispositivos/ativar", { codigoAtivacao });
}

/**
 * Orquestra o cenário mínimo do Fluxo A (ver `frontend/README.md`): SUPER_ADMIN loga, cria um
 * restaurante+categoria+produto novos e um dispositivo TOTEM já ativado, prontos para o teste abrir
 * `/totem` no navegador. Credenciais do admin vêm de env vars (nunca hardcoded) — ver pré-requisitos.
 */
export async function prepararTotemComProduto(request: APIRequestContext): Promise<{
  ativado: AtivarDispositivoResponse;
  nomeProduto: string;
}> {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminSenha = process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminSenha) {
    throw new Error(
      "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD não definidos. O E2E integrado precisa de um SUPER_ADMIN real " +
        "no backend (ver frontend/README.md seção \"E2E integrado\" para como habilitar o bootstrap).",
    );
  }

  const sufixo = sufixoUnico();
  const login = await loginAdmin(request, adminEmail, adminSenha);
  const restaurante = await criarRestaurante(request, login.accessToken, `Restaurante ${sufixo}`);
  const categoria = await criarCategoria(request, login.accessToken, restaurante.id, `Categoria ${sufixo}`);
  const nomeProduto = `Produto ${sufixo}`;
  await criarProduto(request, login.accessToken, restaurante.id, categoria.id, nomeProduto, 19.9);
  const dispositivo = await criarDispositivo(
    request,
    login.accessToken,
    restaurante.id,
    `Totem ${sufixo}`,
    `TOTEM-${sufixo}`,
  );
  if (!dispositivo.codigoAtivacao) {
    throw new Error("Dispositivo criado sem codigoAtivacao — resposta inesperada do backend.");
  }
  const ativado = await ativarDispositivo(request, dispositivo.codigoAtivacao);

  return { ativado, nomeProduto };
}
