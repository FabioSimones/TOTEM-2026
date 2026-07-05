package com.totem.fastfood.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditorias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nullable: ações globais do SUPER_ADMIN não estão vinculadas a um restaurante.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurante_id")
    private Restaurante restaurante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_id")
    private Dispositivo dispositivo;

    /**
     * Código da ação realizada.
     * Exemplos: "PRODUTO_CRIADO", "USUARIO_DESATIVADO", "DISPOSITIVO_REVOGADO".
     */
    @Column(nullable = false, length = 100)
    private String acao;

    /**
     * Nome da entidade afetada. Exemplos: "Produto", "Usuario", "Restaurante".
     * Nullable para ações que não afetam uma entidade específica.
     */
    @Column(name = "entidade_afetada", length = 100)
    private String entidadeAfetada;

    /** ID da entidade afetada. Nullable quando não aplicável. */
    @Column(name = "entidade_id")
    private Long entidadeId;

    @CreationTimestamp
    @Column(name = "data_hora", nullable = false, updatable = false)
    private LocalDateTime dataHora;

    @Column(name = "ip_origem", length = 50)
    private String ipOrigem;

    /** Detalhes da ação em formato livre (pode ser JSON). Nullable. */
    @Column(columnDefinition = "TEXT")
    private String detalhes;
}
