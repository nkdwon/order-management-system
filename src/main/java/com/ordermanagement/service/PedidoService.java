package com.ordermanagement.service;

import com.ordermanagement.model.Pedido;
import com.ordermanagement.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PedidoService {

    @Autowired
    private PedidoRepository pedidoRepository;

    // Criar novo pedido
    public Pedido criarPedido(Pedido pedido) {
        return pedidoRepository.save(pedido);
    }

    // Listar todos os pedidos
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    // Buscar pedido por ID
    public Optional<Pedido> buscarPorId(Long id) {
        return pedidoRepository.findById(id);
    }

    // Atualizar pedido
    public Pedido atualizarPedido(Long id, Pedido pedidoAtualizado) {
        Optional<Pedido> pedidoExistente = pedidoRepository.findById(id);
        if (pedidoExistente.isPresent()) {
            Pedido pedido = pedidoExistente.get();
            if (pedidoAtualizado.getData() != null) {
                pedido.setData(pedidoAtualizado.getData());
            }
            if (pedidoAtualizado.getValorTotal() > 0) {
                pedido.setValorTotal(pedidoAtualizado.getValorTotal());
            }
            if (pedidoAtualizado.getItens() != null) {
                pedido.setItens(pedidoAtualizado.getItens());
            }
            return pedidoRepository.save(pedido);
        }
        return null;
    }

    // Deletar pedido
    public void deletarPedido(Long id) {
        pedidoRepository.deleteById(id);
    }

    // Confirmar pedido (cálculo de valor total)
    public Pedido confirmarPedido(Long id) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            double valorTotal = pedido.getItens().stream()
                    .mapToDouble(item -> item.getValorItem() * item.getQuantidade())
                    .sum();
            pedido.setValorTotal(valorTotal);
            return pedidoRepository.save(pedido);
        }
        return null;
    }
}
