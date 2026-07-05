# Estrutura Recomendada do Projeto

## Estrutura geral

```text
totem-fast-food/
├── backend/
├── frontend/
├── docs/
├── tasks/
├── skills/
├── agents/
├── prompts/
├── checklists/
├── templates/
└── README.md
```

## Backend

```text
backend/src/main/java/com/totem/fastfood
├── controller
│   ├── admin
│   ├── auth
│   ├── caixa
│   ├── cozinha
│   └── totem
├── service
├── repository
├── entity
├── dto
├── enums
├── exception
├── config
├── security
├── integration
│   └── payment
└── mapper
```

## Responsabilidade das camadas

| Camada | Responsabilidade |
|---|---|
| controller | Receber requisições HTTP e acionar services |
| service | Aplicar regras de negócio, validações e orquestrações |
| repository | Acessar o banco de dados via Spring Data JPA |
| entity | Representar tabelas e relacionamentos |
| dto | Transportar dados entre API e cliente sem expor entidades |
| enums | Padronizar status, formas de pagamento, tipos e perfis |
| exception | Tratamento global e padronizado de erros |
| config | CORS, Swagger, beans e configurações gerais |
| security | Autenticação, autorização, JWT, filtros e permissões |
| integration | Integrações externas, como pagamentos e impressão |
| mapper | Conversão entre Entity e DTO |
