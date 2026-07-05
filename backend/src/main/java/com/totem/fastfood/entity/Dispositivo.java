package com.totem.fastfood.entity;

import com.totem.fastfood.enums.TipoDispositivo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispositivos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispositivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurante_id", nullable = false)
    private Restaurante restaurante;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(name = "codigo_identificacao", nullable = false, length = 100, unique = true)
    private String codigoIdentificacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_dispositivo", nullable = false, length = 50)
    private TipoDispositivo tipoDispositivo;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "ultimo_acesso")
    private LocalDateTime ultimoAcesso;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}
