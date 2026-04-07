package com.ordermanagement.service;

import com.ordermanagement.model.Item;
import com.ordermanagement.model.Pedido;
import com.ordermanagement.model.Produto;
import com.ordermanagement.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private ProdutoService produtoService;

    @Transactional
    public Item criarItem(Item item) {
        if (item == null || item.getPedido() == null || item.getProduto() == null) {
            throw new IllegalArgumentException("Item, pedido ou produto inválido");
        }

        Long produtoId = item.getProduto().getId();
        Long pedidoId = item.getPedido().getId();
        Integer quantidade = item.getQuantidade();

        if (produtoId == null || pedidoId == null) {
            throw new IllegalArgumentException("IDs de pedido e produto são obrigatórios");
        }

        if (quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }

        Produto produto = produtoService.buscarEntidade(produtoId);
        Pedido pedido = pedidoService.buscarEntidade(pedidoId);

        produtoService.reduzirEstoque(produto.getId(), quantidade);

        item.setProduto(produto);
        item.setPedido(pedido);
        item.setValorItem(produto.getPreco());
        Item saved = itemRepository.save(item);

        pedidoService.confirmarPedido(pedidoId);

        return saved;
    }

    public List<Item> listarTodos() {
        return itemRepository.findAll();
    }

    public Optional<Item> buscarPorId(Long id) {
        return itemRepository.findById(id);
    }

    @Transactional
    public Item atualizarItem(Long id, Item itemAtualizado) {
        Optional<Item> itemExistente = itemRepository.findById(id);
        if (itemExistente.isPresent()) {
            Item item = itemExistente.get();
            Produto produtoAtual = item.getProduto();
            Pedido pedidoAtual = item.getPedido();

            Long novoProdutoId = itemAtualizado.getProduto() != null && itemAtualizado.getProduto().getId() != null
                    ? itemAtualizado.getProduto().getId()
                    : produtoAtual.getId();

            Long novoPedidoId = itemAtualizado.getPedido() != null && itemAtualizado.getPedido().getId() != null
                    ? itemAtualizado.getPedido().getId()
                    : pedidoAtual.getId();

            Integer novaQuantidade = itemAtualizado.getQuantidade() != null ? itemAtualizado.getQuantidade()
                    : item.getQuantidade();
            if (novaQuantidade <= 0) {
                throw new IllegalArgumentException("Quantidade deve ser maior que zero");
            }

            Produto novoProduto = produtoService.buscarEntidade(novoProdutoId);
            Pedido novoPedido = pedidoService.buscarEntidade(novoPedidoId);

            // Devolve estoque anterior do item atual.
            produtoService.aumentarEstoque(produtoAtual.getId(), item.getQuantidade());
            // Consome estoque conforme o novo estado.
            produtoService.reduzirEstoque(novoProduto.getId(), novaQuantidade);

            item.setProduto(novoProduto);
            item.setPedido(novoPedido);
            item.setQuantidade(novaQuantidade);
            item.setValorItem(novoProduto.getPreco());

            Item saved = itemRepository.save(item);

            // Atualiza totais dos pedidos impactados.
            pedidoService.confirmarPedido(pedidoAtual.getId());
            if (!pedidoAtual.getId().equals(novoPedido.getId())) {
                pedidoService.confirmarPedido(novoPedido.getId());
            }

            return saved;
        }
        return null;
    }

    @Transactional
    public void deletarItem(Long id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            Produto produto = item.getProduto();
            Pedido pedido = item.getPedido();

            if (pedido != null) {
                // Remove via relacionamento para respeitar orphanRemoval e evitar
                // inconsistência de estado no contexto de persistência.
                pedido.removerItem(item);
            } else {
                itemRepository.delete(item);
            }

            if (produto != null) {
                produtoService.aumentarEstoque(produto.getId(), item.getQuantidade());
            }

            if (pedido != null) {
                pedidoService.confirmarPedido(pedido.getId());
            }
        }
    }
}
