import "@testing-library/jest-dom";

// Fuso fixo para os testes (TASK-101): garante que asserts de data/hora não dependam do fuso
// horário da máquina/CI que roda a suíte — a aplicação em si nunca lê `process.env.TZ` (browser
// usa o fuso do sistema operacional/navegador), isso afeta só a formatação dentro dos testes.
process.env.TZ = "UTC";
