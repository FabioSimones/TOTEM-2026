package com.totem.fastfood.entity;

import com.totem.fastfood.enums.FormaPagamento;
import com.totem.fastfood.enums.StatusPagamento;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Um pedido pode ter múltiplos registros de pagamento
     * (ex: tentativa PIX falhou, tentou cartão em seguida).
     * O service controla qual pagamento está ativo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pagamento", nullable = false, length = 50)
    private FormaPagamento formaPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", nullable = false, length = 50)
    private StatusPagamento statusPagamento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    /**
     * Identifica o provedor usado: "FAKE", "PIX_REAL", "STONE", etc.
     * No MVP, sempre "FAKE".
     */
    @Column(name = "payment_provider", length = 50)
    private String paymentProvider;

    /** ID retornado pelo provedor externo (nullable no MVP com FakeProvider). */
    @Column(name = "external_payment_id", length = 200)
    private String externalPaymentId;

    /** QR Code Pix em formato texto. Nullable para formas de pagamento não-Pix. */
    @Column(name = "qr_code_pix", columnDefinition = "TEXT")
    private String qrCodePix;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    /** Preenchido pelo service quando o pagamento é confirmado. */
    @Column(name = "pago_em")
    private LocalDateTime pagoEm;

    /** Preenchido pelo service quando o pagamento é cancelado ou estornado. */
    @Column(name = "cancelado_em")
    private LocalDateTime canceladoEm;
}
