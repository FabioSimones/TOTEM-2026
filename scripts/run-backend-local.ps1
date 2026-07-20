# Sobe o backend LOCALMENTE com variáveis de desenvolvimento (TASK-097/098/096).
# Uso exclusivo de ambiente local — nunca aponta para segredo/senha de produção.
# Ver README.md, seção "Como subir o backend localmente (Windows/PowerShell e IntelliJ)".

$env:JWT_SECRET = "chave-local-de-desenvolvimento-com-mais-de-32-caracteres"
$env:CORS_ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
$env:SUPER_ADMIN_BOOTSTRAP_ENABLED = "true"
$env:SUPER_ADMIN_EMAIL = "admin.local@totem.local"
$env:SUPER_ADMIN_PASSWORD = "AdminLocal@2026!"

Push-Location (Join-Path $PSScriptRoot "..\backend")
try {
    mvn spring-boot:run
} finally {
    Pop-Location
}
