import type { Page } from "@playwright/test";

/**
 * Mocks de rede para a suíte E2E (TASK-102). `page.route` intercepta a chamada mesmo sendo
 * cross-origin (frontend em 127.0.0.1:5173, `VITE_API_BASE_URL` apontando para 8080) — não é
 * necessário um backend real rodando para nenhum teste desta suíte.
 */

export async function mockJson(page: Page, urlGlob: string, status: number, body: unknown): Promise<void> {
  await page.route(urlGlob, async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export const superAdminUsuarioMock = {
  id: 1,
  nome: "Admin E2E",
  email: "admin.e2e@totem.local",
  perfil: "SUPER_ADMIN" as const,
  restauranteId: null,
  ativo: true,
};

export function loginResponseMock() {
  return {
    accessToken: "e2e-access-token",
    refreshToken: "e2e-refresh-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: superAdminUsuarioMock,
  };
}

/**
 * TASK-118: GET /api/admin/dashboard — o dashboard fundido (`AdminDashboardPage`) chama isso
 * assim que `/admin` monta, então qualquer teste que navegue até lá precisa mockar este endpoint
 * (senão a chamada tentaria ir para a rede de verdade, cross-origin, sem interceptação).
 */
export function dashboardAdminResumoMock() {
  return {
    restauranteId: null,
    restauranteNome: null,
    dataReferencia: "2026-01-01",
    totalPedidosHoje: 5,
    pendentesPagamento: 1,
    pagosAguardandoCozinha: 1,
    emOperacao: 1,
    prontosRetirada: 0,
    retiradosHoje: 2,
    canceladosHoje: 0,
    expiradosHoje: 0,
    valorPagoHoje: 123.4,
  };
}

export const adminRestauranteUsuarioMock = {
  id: 2,
  nome: "Admin Restaurante E2E",
  email: "admin.restaurante.e2e@totem.local",
  perfil: "ADMIN_RESTAURANTE" as const,
  restauranteId: 1,
  ativo: true,
};

export function loginResponseAdminRestauranteMock() {
  return {
    accessToken: "e2e-access-token-admin-restaurante",
    refreshToken: "e2e-refresh-token-admin-restaurante",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: adminRestauranteUsuarioMock,
  };
}

export const operadorMock = {
  id: 9,
  nome: "Operador E2E",
  email: "operador.e2e@totem.local",
  perfil: "OPERADOR_CAIXA" as const,
  restauranteId: 1,
};

export function operadorLoginResponseMock() {
  return {
    operadorToken: "e2e-operador-token",
    expiresIn: 1800,
    operador: operadorMock,
  };
}

/** Login de usuário humano (POST /api/auth/login) com perfil OPERADOR_CAIXA — usado no fluxo de /login central, distinto do login de OPERADOR dentro do terminal (operadorLoginResponseMock). */
export const operadorCaixaUsuarioMock = {
  id: 9,
  nome: "Operador Caixa E2E",
  email: "operador.caixa.e2e@totem.local",
  perfil: "OPERADOR_CAIXA" as const,
  restauranteId: 1,
  ativo: true,
};

export function loginResponseOperadorCaixaMock() {
  return {
    accessToken: "e2e-access-token-operador-caixa",
    refreshToken: "e2e-refresh-token-operador-caixa",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: operadorCaixaUsuarioMock,
  };
}

export const operadorCozinhaUsuarioMock = {
  id: 10,
  nome: "Operador Cozinha E2E",
  email: "operador.cozinha.e2e@totem.local",
  perfil: "OPERADOR_COZINHA" as const,
  restauranteId: 1,
  ativo: true,
};

export function loginResponseOperadorCozinhaMock() {
  return {
    accessToken: "e2e-access-token-operador-cozinha",
    refreshToken: "e2e-refresh-token-operador-cozinha",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshExpiresIn: 604800,
    usuario: operadorCozinhaUsuarioMock,
  };
}

export function cardapioMock() {
  return {
    restauranteId: 1,
    categorias: [
      {
        id: 1,
        nome: "Lanches",
        descricao: null,
        ordemExibicao: 1,
        produtos: [
          {
            id: 100,
            nome: "X-Burger E2E",
            descricao: "Hambúrguer de teste",
            preco: 25.9,
            imagemUrl: null,
            destaque: false,
            recomendado: false,
            ordemExibicao: 1,
          },
        ],
      },
    ],
  };
}

export function pedidoPendenteCaixaMock() {
  return [
    {
      pedidoId: 1,
      numeroPedido: "A1",
      statusPedido: "AGUARDANDO_PAGAMENTO_DINHEIRO" as const,
      tipoConsumo: "LOCAL" as const,
      clienteNome: "Cliente E2E",
      valorTotal: 25.9,
      criadoEm: "2026-01-01T12:00:00Z",
      atualizadoEm: "2026-01-01T12:00:00Z",
      acaoSugerida: "CONFIRMAR_PAGAMENTO" as const,
      itens: [
        { produtoId: 100, nomeProduto: "X-Burger E2E", quantidade: 1, observacao: null, subtotal: 25.9 },
      ],
    },
  ];
}

export function pedidoCozinhaMock() {
  return [
    {
      pedidoId: 2,
      numeroPedido: "A2",
      statusPedido: "ENVIADO_PARA_COZINHA" as const,
      tipoConsumo: "LOCAL" as const,
      clienteNome: "Cliente E2E",
      criadoEm: "2026-01-01T12:00:00Z",
      atualizadoEm: "2026-01-01T12:00:00Z",
      itens: [{ produtoId: 100, nomeProduto: "X-Burger E2E", quantidade: 1, observacao: null }],
    },
  ];
}
