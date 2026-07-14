import type { APIRequestContext } from "@playwright/test";
import type { AtivarDispositivoResponse, LoginResponse, PerfilUsuario, TipoDispositivo } from "../../src/types/auth";
import type { CriarCategoriaRequest, CategoriaAdminResponse } from "../../src/types/categoria";
import type { CriarDispositivoRequest, DispositivoAdminResponse } from "../../src/types/dispositivo";
import type { PedidoAdminDetalheResponse } from "../../src/types/pedidoAdmin";
import type { CriarProdutoRequest, ProdutoAdminResponse } from "../../src/types/produto";
import type { CriarRestauranteRequest, RestauranteAdminResponse } from "../../src/types/restaurante";
import type {
  CriarPedidoTotemRequest,
  FormaPagamento,
  IniciarPagamentoTotemRequest,
  PagamentoTotemResponse,
  PedidoTotemResponse,
} from "../../src/types/totem";
import type { CriarUsuarioRequest, UsuarioAdminResponse } from "../../src/types/usuario";

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

async function getJson<TResponse>(request: APIRequestContext, path: string, token: string): Promise<TResponse> {
  const response = await request.get(`${E2E_API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) {
    throw new Error(`GET ${path} falhou (HTTP ${response.status()}): ${await response.text()}`);
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

/** `tipoDispositivo` é opcional (default `"TOTEM"`) — TASK-104 só criava TOTEM; TASK-105 reaproveita para CAIXA/COZINHA. */
export async function criarDispositivo(
  request: APIRequestContext,
  token: string,
  restauranteId: number,
  nome: string,
  codigoIdentificacao: string,
  tipoDispositivo: TipoDispositivo = "TOTEM",
): Promise<DispositivoAdminResponse> {
  const body: CriarDispositivoRequest = { restauranteId, nome, codigoIdentificacao, tipoDispositivo };
  return postJson<DispositivoAdminResponse>(request, "/api/admin/dispositivos", body, token);
}

/** POST /api/admin/usuarios — cria um usuário OPERADOR_CAIXA/OPERADOR_COZINHA (ou outro perfil, se necessário) no restaurante informado. */
export async function criarUsuarioOperador(
  request: APIRequestContext,
  adminToken: string,
  restauranteId: number,
  nome: string,
  email: string,
  senha: string,
  perfil: PerfilUsuario,
): Promise<UsuarioAdminResponse> {
  const body: CriarUsuarioRequest = { restauranteId, nome, email, senha, perfil };
  return postJson<UsuarioAdminResponse>(request, "/api/admin/usuarios", body, adminToken);
}

/** POST /api/totem/pedidos — usa o accessToken do dispositivo TOTEM (não o do admin). */
export async function criarPedidoTotem(
  request: APIRequestContext,
  totemAccessToken: string,
  produtoId: number,
): Promise<PedidoTotemResponse> {
  const body: CriarPedidoTotemRequest = {
    tipoConsumo: "LOCAL",
    clienteNome: "Cliente E2E Integrado",
    itens: [{ produtoId, quantidade: 1 }],
  };
  return postJson<PedidoTotemResponse>(request, "/api/totem/pedidos", body, totemAccessToken);
}

/** POST /api/totem/pedidos/{id}/pagamento — Pix/cartão autorizam de forma síncrona (FakePaymentProvider). */
export async function pagarPedidoTotem(
  request: APIRequestContext,
  totemAccessToken: string,
  pedidoId: number,
  formaPagamento: FormaPagamento = "PIX",
): Promise<PagamentoTotemResponse> {
  const body: IniciarPagamentoTotemRequest = { formaPagamento };
  return postJson<PagamentoTotemResponse>(request, `/api/totem/pedidos/${pedidoId}/pagamento`, body, totemAccessToken);
}

/** GET /api/admin/pedidos/{id} — detalhe com itens, pagamentos e histórico (usado para validar auditoria por operador/dispositivo). */
export async function consultarPedidoAdmin(
  request: APIRequestContext,
  adminToken: string,
  pedidoId: number,
): Promise<PedidoAdminDetalheResponse> {
  return getJson<PedidoAdminDetalheResponse>(request, `/api/admin/pedidos/${pedidoId}`, adminToken);
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

function exigirCredenciaisAdmin(): { email: string; senha: string } {
  const email = process.env.E2E_ADMIN_EMAIL;
  const senha = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !senha) {
    throw new Error(
      "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD não definidos. O E2E integrado precisa de um SUPER_ADMIN real " +
        "no backend (ver frontend/README.md seção \"E2E integrado\" para como habilitar o bootstrap).",
    );
  }
  return { email, senha };
}

async function ativarDispositivoComCodigo(
  request: APIRequestContext,
  dispositivo: DispositivoAdminResponse,
): Promise<AtivarDispositivoResponse> {
  if (!dispositivo.codigoAtivacao) {
    throw new Error(`Dispositivo "${dispositivo.nome}" criado sem codigoAtivacao — resposta inesperada do backend.`);
  }
  return ativarDispositivo(request, dispositivo.codigoAtivacao);
}

export interface OperadorCriado {
  nome: string;
  email: string;
  senha: string;
}

/**
 * Orquestra o cenário mínimo do fluxo Caixa/Cozinha/operador (TASK-105): reaproveita os mesmos
 * helpers de baixo nível da TASK-104 (login admin, criar restaurante/categoria/produto,
 * criar+ativar dispositivo) para montar um restaurante com produto, dispositivos CAIXA e COZINHA já
 * ativados, dois usuários operadores (um por terminal) e um pedido real já `PAGO` (criado e pago
 * via API do Totem, com o accessToken de um dispositivo TOTEM descartável — sem passar pela UI,
 * conforme a estratégia recomendada para esta task: só Caixa/Cozinha precisam ser exercitados na
 * tela de verdade, o pedido em si não é o foco aqui).
 */
export async function prepararCenarioCaixaCozinha(request: APIRequestContext): Promise<{
  restauranteId: number;
  pedidoId: number;
  numeroPedido: string;
  caixaAtivado: AtivarDispositivoResponse;
  cozinhaAtivado: AtivarDispositivoResponse;
  operadorCaixa: OperadorCriado;
  operadorCozinha: OperadorCriado;
  adminAccessToken: string;
}> {
  const { email: adminEmail, senha: adminSenha } = exigirCredenciaisAdmin();
  const sufixo = sufixoUnico();

  const login = await loginAdmin(request, adminEmail, adminSenha);
  const restaurante = await criarRestaurante(request, login.accessToken, `Restaurante ${sufixo}`);
  const categoria = await criarCategoria(request, login.accessToken, restaurante.id, `Categoria ${sufixo}`);
  const produto = await criarProduto(request, login.accessToken, restaurante.id, categoria.id, `Produto ${sufixo}`, 19.9);

  const dispositivoTotem = await criarDispositivo(
    request,
    login.accessToken,
    restaurante.id,
    `Totem ${sufixo}`,
    `TOTEM-${sufixo}`,
    "TOTEM",
  );
  const dispositivoCaixa = await criarDispositivo(
    request,
    login.accessToken,
    restaurante.id,
    `Caixa ${sufixo}`,
    `CAIXA-${sufixo}`,
    "CAIXA",
  );
  const dispositivoCozinha = await criarDispositivo(
    request,
    login.accessToken,
    restaurante.id,
    `Cozinha ${sufixo}`,
    `COZINHA-${sufixo}`,
    "COZINHA",
  );

  const totemAtivado = await ativarDispositivoComCodigo(request, dispositivoTotem);
  const caixaAtivado = await ativarDispositivoComCodigo(request, dispositivoCaixa);
  const cozinhaAtivado = await ativarDispositivoComCodigo(request, dispositivoCozinha);

  const operadorCaixa: OperadorCriado = {
    nome: `Operador Caixa ${sufixo}`,
    email: `operador.caixa.${sufixo}@e2e.totem.local`,
    senha: "SenhaOperadorE2E@2026",
  };
  const operadorCozinha: OperadorCriado = {
    nome: `Operador Cozinha ${sufixo}`,
    email: `operador.cozinha.${sufixo}@e2e.totem.local`,
    senha: "SenhaOperadorE2E@2026",
  };
  await criarUsuarioOperador(
    request,
    login.accessToken,
    restaurante.id,
    operadorCaixa.nome,
    operadorCaixa.email,
    operadorCaixa.senha,
    "OPERADOR_CAIXA",
  );
  await criarUsuarioOperador(
    request,
    login.accessToken,
    restaurante.id,
    operadorCozinha.nome,
    operadorCozinha.email,
    operadorCozinha.senha,
    "OPERADOR_COZINHA",
  );

  const pedido = await criarPedidoTotem(request, totemAtivado.accessToken, produto.id);
  const pagamento = await pagarPedidoTotem(request, totemAtivado.accessToken, pedido.pedidoId, "PIX");
  if (pagamento.statusPagamento !== "AUTORIZADO" || pagamento.statusPedido !== "PAGO") {
    throw new Error(
      `Pagamento do pedido de setup não ficou PAGO como esperado (statusPagamento=${pagamento.statusPagamento}, statusPedido=${pagamento.statusPedido}).`,
    );
  }

  return {
    restauranteId: restaurante.id,
    pedidoId: pedido.pedidoId,
    numeroPedido: pedido.numeroPedido,
    caixaAtivado,
    cozinhaAtivado,
    operadorCaixa,
    operadorCozinha,
    adminAccessToken: login.accessToken,
  };
}
