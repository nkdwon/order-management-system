package com.ordermanagement.service;

import com.ordermanagement.model.Pedido;
import com.ordermanagement.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Transactional
    public Pedido criarPedido(Pedido pedido) {
        if (pedido == null) {
            throw new IllegalArgumentException("Pedido inválido");
        }
        if (pedido.getData() == null) {
            pedido.setData(java.time.LocalDate.now());
        }
        pedido.calcularTotal();
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Optional<Pedido> buscarPorId(Long id) {
        return pedidoRepository.findById(id);
    }

    @Transactional
    public Pedido atualizarPedido(Long id, Pedido pedidoAtualizado) {
        Optional<Pedido> pedidoExistente = pedidoRepository.findById(id);
        if (pedidoExistente.isPresent()) {
            Pedido pedido = pedidoExistente.get();
            if (pedidoAtualizado.getData() != null) {
                pedido.setData(pedidoAtualizado.getData());
            }

            // valorTotal é derivado dos itens, portanto não deve ser definido pelo cliente.
            pedido.calcularTotal();
            return pedidoRepository.save(pedido);
        }
        return null;
    }

    @Transactional
    public void deletarPedido(Long id) {
        pedidoRepository.deleteById(id);
    }

    @Transactional
    public Pedido confirmarPedido(Long id) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            pedido.calcularTotal();
            return pedidoRepository.save(pedido);
        }
        return null;
    }

    public Pedido buscarEntidade(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado: id=" + id));
    }
}
