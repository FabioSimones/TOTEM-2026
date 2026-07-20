import "@testing-library/jest-dom";

// Fuso fixo para os testes (TASK-101): garante que asserts de data/hora não dependam do fuso
// horário da máquina/CI que roda a suíte — a aplicação em si nunca lê `process.env.TZ` (browser
// usa o fuso do sistema operacional/navegador), isso afeta só a formatação dentro dos testes.
process.env.TZ = "UTC";

// jsdom não implementa `matchMedia` nem `Element.scrollIntoView` (TASK-115): usados pelo foco
// automático no primeiro campo inválido (`focarPrimeiroErro`), que respeita `prefers-reduced-motion`.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}
if (!window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = () => {};
}
