package com.totem.fastfood.service;

import com.totem.fastfood.dto.dispositivo.AtivarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.AtualizarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.AtivarDispositivoResponse;
import com.totem.fastfood.dto.dispositivo.CriarDispositivoRequest;
import com.totem.fastfood.dto.dispositivo.DispositivoResponse;
import com.totem.fastfood.entity.Dispositivo;
import com.totem.fastfood.entity.Restaurante;
import com.totem.fastfood.mapper.DispositivoMapper;
import com.totem.fastfood.repository.DispositivoRepository;
import com.totem.fastfood.repository.RestauranteRepository;
import com.totem.fastfood.security.AdminScopeService;
import com.totem.fastfood.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispositivoService {

    private static final int TENTATIVAS_MAXIMAS_CODIGO = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final DispositivoRepository dispositivoRepository;
    private final RestauranteRepository restauranteRepository;
    private final DispositivoMapper dispositivoMapper;
    private final JwtService jwtService;
    private final AdminScopeService adminScopeService;
    private final Clock clock;

    @Transactional
    public DispositivoResponse criar(CriarDispositivoRequest request) {
        Restaurante restaurante = restauranteRepository.findById(request.restauranteId())
                .orElseThrow(() -> new NoSuchElementException(
                        "Restaurante não encontrado para o id: " + request.restauranteId()));

        adminScopeService.validarAcessoRestaurante(request.restauranteId());

        if (dispositivoRepository.existsByCodigoIdentificacao(request.codigoIdentificacao())) {
            throw new IllegalArgumentException(
                    "Já existe um dispositivo cadastrado com o código de identificação: " + request.codigoIdentificacao());
        }

        Dispositivo dispositivo = dispositivoMapper.toEntity(request, restaurante);
        dispositivo.setCodigoAtivacao(gerarCodigoAtivacaoUnico());

        Dispositivo salvo = dispositivoRepository.save(dispositivo);
        log.info("Dispositivo cadastrado: id={}, codigoIdentificacao={}", salvo.getId(), salvo.getCodigoIdentificacao());
        return dispositivoMapper.toResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<DispositivoResponse> listar() {
        List<Dispositivo> dispositivos = adminScopeService.isSuperAdmin()
                ? dispositivoRepository.findAll()
                : dispositivoRepository.findByRestauranteId(adminScopeService.getRestauranteIdUsuarioAtual());
        return dispositivoMapper.toResponseList(dispositivos);
    }

    @Transactional
    public DispositivoResponse atualizar(Long id, AtualizarDispositivoRequest request) {
        Dispositivo dispositivo = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(dispositivo.getRestaurante().getId());

        if (dispositivoRepository.existsByCodigoIdentificacaoAndIdNot(request.codigoIdentificacao(), id)) {
            throw new IllegalArgumentException(
                    "Já existe outro dispositivo cadastrado com o código de identificação: " + request.codigoIdentificacao());
        }

        dispositivoMapper.atualizarEntidade(dispositivo, request);
        Dispositivo atualizado = dispositivoRepository.save(dispositivo);
        log.info("Dispositivo atualizado: id={}", id);
        return dispositivoMapper.toResponse(atualizado);
    }

    @Transactional
    public DispositivoResponse revogar(Long id) {
        Dispositivo dispositivo = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(dispositivo.getRestaurante().getId());
        dispositivo.setAtivo(false);
        dispositivo.setRevogadoEm(LocalDateTime.now(clock));
        log.info("Dispositivo revogado: id={}", id);
        return dispositivoMapper.toResponse(dispositivoRepository.save(dispositivo));
    }

    @Transactional
    public DispositivoResponse reativar(Long id) {
        Dispositivo dispositivo = buscarOuLancarExcecao(id);
        adminScopeService.validarAcessoRestaurante(dispositivo.getRestaurante().getId());
        dispositivo.setAtivo(true);
        dispositivo.setRevogadoEm(null);
        log.info("Dispositivo reativado: id={}", id);
        return dispositivoMapper.toResponse(dispositivoRepository.save(dispositivo));
    }

    @Transactional
    public AtivarDispositivoResponse ativarComCodigo(AtivarDispositivoRequest request) {
        Dispositivo dispositivo = dispositivoRepository.findByCodigoAtivacao(request.codigoAtivacao())
                .orElseThrow(() -> new BadCredentialsException("Código de ativação inválido"));

        if (!Boolean.TRUE.equals(dispositivo.getAtivo())) {
            throw new BadCredentialsException("Código de ativação inválido");
        }

        dispositivo.setAtivado(true);
        LocalDateTime agora = LocalDateTime.now(clock);
        dispositivo.setAtivadoEm(agora);
        dispositivo.setUltimoAcesso(agora);
        dispositivo.setCodigoAtivacao(null);
        Dispositivo ativado = dispositivoRepository.save(dispositivo);

        String token = jwtService.gerarTokenDispositivo(ativado);
        log.info("Dispositivo ativado: id={}, tipoDispositivo={}", ativado.getId(), ativado.getTipoDispositivo());

        return new AtivarDispositivoResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                dispositivoMapper.toAutenticadoResponse(ativado)
        );
    }

    private Dispositivo buscarOuLancarExcecao(Long id) {
        return dispositivoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dispositivo não encontrado para o id: " + id));
    }

    /** Gera um código aleatório de 192 bits (não sequencial/previsível) e garante unicidade. */
    private String gerarCodigoAtivacaoUnico() {
        for (int tentativa = 0; tentativa < TENTATIVAS_MAXIMAS_CODIGO; tentativa++) {
            byte[] bytes = new byte[24];
            SECURE_RANDOM.nextBytes(bytes);
            String codigo = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            if (!dispositivoRepository.findByCodigoAtivacao(codigo).isPresent()) {
                return codigo;
            }
        }
        throw new IllegalStateException("Não foi possível gerar um código de ativação único");
    }
}
