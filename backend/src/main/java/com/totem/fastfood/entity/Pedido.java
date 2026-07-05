package com.totem.fastfood.entity;

import com.totem.fastfood.enums.StatusPedido;
import com.totem.fastfood.enums.TipoConsumo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "pedidos",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_pedidos_numero_restaurante",
        columnNames = {"restaurante_id", "numero_pedido"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurante_id", nullable = false)
    private Restaurante restaurante;

    @Column(name = "numero_pedido", nullable = false, length = 20)
    private String numeroPedido;

    @Column(name = "cliente_nome", length = 200)
    private String clienteNome;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_consumo", nullable = false, length = 50)
    private TipoConsumo tipoConsumo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pedido", nullable = false, length = 50)
    private StatusPedido statusPedido;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    /**
     * Nullable: permite criação de pedidos administrativos ou por outros meios
     * além do totem físico.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_origem_id")
    private Dispositivo dispositivoOrigem;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}
