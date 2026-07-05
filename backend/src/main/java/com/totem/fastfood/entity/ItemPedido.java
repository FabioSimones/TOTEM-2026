package com.totem.fastfood.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "itens_pedido")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    /**
     * Nullable: produto pode ser desativado ou removido no futuro.
     * O snapshot abaixo preserva os dados históricos do item.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id")
    private Produto produto;

    /**
     * Snapshot do nome do produto no momento da compra.
     * Preserva o histórico independentemente de mudanças futuras no produto.
     */
    @Column(name = "nome_produto", nullable = false, length = 200)
    private String nomeProduto;

    @Column(nullable = false)
    private Integer quantidade;

    /**
     * Snapshot do preço unitário no momento da compra.
     * O backend calcula e armazena — nunca confia no valor enviado pelo frontend.
     */
    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    /**
     * Calculado pelo backend: quantidade * precoUnitario.
     * Armazenado para integridade histórica.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(length = 500)
    private String observacao;
}
