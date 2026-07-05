package com.totem.fastfood.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nullable: RefreshToken pertence a um usuário OU a um dispositivo.
     * Constraint de negócio: ao menos um dos dois deve ser preenchido.
     * Validação aplicada no service (TASK-010).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    /**
     * Nullable: RefreshToken pertence a um usuário OU a um dispositivo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_id")
    private Dispositivo dispositivo;

    /**
     * Hash do token armazenado por segurança.
     * O token bruto é enviado ao cliente; apenas o hash fica no banco.
     * Único para evitar colisões.
     */
    @Column(name = "token_hash", nullable = false, length = 255, unique = true)
    private String tokenHash;

    @Column(name = "expira_em", nullable = false)
    private LocalDateTime expiraEm;

    @Column(nullable = false)
    @Builder.Default
    private Boolean revogado = false;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    /** Preenchido pelo service quando o token é revogado explicitamente. */
    @Column(name = "revogado_em")
    private LocalDateTime revogadoEm;
}
