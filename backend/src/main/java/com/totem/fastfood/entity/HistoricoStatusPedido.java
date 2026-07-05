package com.totem.fastfood.entity;

import com.totem.fastfood.enums.StatusPedido;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "historico_status_pedido")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricoStatusPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    /**
     * Nullable no primeiro registro: pedido recém-criado não tem status anterior.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status_anterior", length = 50)
    private StatusPedido statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_novo", nullable = false, length = 50)
    private StatusPedido statusNovo;

    @CreationTimestamp
    @Column(name = "data_alteracao", nullable = false, updatable = false)
    private LocalDateTime dataAlteracao;

    /** Nullable: mudança pode ter sido feita por sistema automático (ex: expiração). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por_usuario_id")
    private Usuario alteradoPorUsuario;

    /** Nullable: mudança pode ter sido feita por usuário humano. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por_dispositivo_id")
    private Dispositivo alteradoPorDispositivo;

    @Column(length = 500)
    private String observacao;
}
