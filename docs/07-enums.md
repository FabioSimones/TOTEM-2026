# Enums do Sistema

## StatusPedido

```java
public enum StatusPedido {
    CRIADO,
    AGUARDANDO_PAGAMENTO,
    AGUARDANDO_PAGAMENTO_DINHEIRO,
    PAGO,
    ENVIADO_PARA_COZINHA,
    EM_PREPARO,
    PRONTO,
    RETIRADO,
    CANCELADO,
    EXPIRADO
}
```

## StatusPagamento

```java
public enum StatusPagamento {
    PENDENTE,
    AUTORIZADO,
    RECUSADO,
    CANCELADO,
    ESTORNADO
}
```

## FormaPagamento

```java
public enum FormaPagamento {
    PIX,
    CARTAO_CREDITO,
    CARTAO_DEBITO,
    DINHEIRO
}
```

## TipoDispositivo

```java
public enum TipoDispositivo {
    TOTEM,
    CAIXA,
    COZINHA,
    ADMINISTRACAO
}
```

## PerfilUsuario

```java
public enum PerfilUsuario {
    SUPER_ADMIN,
    ADMIN_RESTAURANTE,
    OPERADOR_CAIXA,
    OPERADOR_COZINHA
}
```

## TipoConsumo

```java
public enum TipoConsumo {
    LOCAL,
    VIAGEM
}
```
