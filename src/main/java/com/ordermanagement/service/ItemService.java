package com.ordermanagement.service;

import com.ordermanagement.model.Item;
import com.ordermanagement.repository.ItemRepository;
import com.ordermanagement.service.PedidoService;
import com.ordermanagement.service.ProdutoService;
import com.ordermanagement.model.Produto;
import com.ordermanagement.model.Pedido;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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

    // Criar novo item
    public Item criarItem(Item item) {
        // Validações básicas
        if (item == null || item.getPedido() == null || item.getProduto() == null) {
            throw new IllegalArgumentException("Item, pedido ou produto inválido");
        }

        Long produtoId = item.getProduto().getId();
        Long pedidoId = item.getPedido().getId();
        int quantidade = item.getQuantidade();

        if (quantidade <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }

        // Verifica estoque
        if (!produtoService.verificarEstoque(produtoId, quantidade)) {
            throw new IllegalArgumentException("Estoque insuficiente para o produto id=" + produtoId);
        }

        // Salva o item
        Item saved = itemRepository.save(item);

        // Reduz estoque do produto
        produtoService.reduzirEstoque(produtoId, quantidade);

        // Recalcula e atualiza valorTotal do pedido
        pedidoService.confirmarPedido(pedidoId);

        return saved;
    }

    // Listar todos os itens
    public List<Item> listarTodos() {
        return itemRepository.findAll();
    }

    // Buscar item por ID
    public Optional<Item> buscarPorId(Long id) {
        return itemRepository.findById(id);
    }

    // Atualizar item
    public Item atualizarItem(Long id, Item itemAtualizado) {
        Optional<Item> itemExistente = itemRepository.findById(id);
        if (itemExistente.isPresent()) {
            Item item = itemExistente.get();
            // Ajuste de estoque quando quantidade ou produto mudam
            int novoQuantidade = itemAtualizado.getQuantidade() > 0 ? itemAtualizado.getQuantidade() : item.getQuantidade();
            double novoValorItem = itemAtualizado.getValorItem() > 0 ? itemAtualizado.getValorItem() : item.getValorItem();

            Long oldProdutoId = item.getProduto() != null ? item.getProduto().getId() : null;
            Long newProdutoId = itemAtualizado.getProduto() != null ? itemAtualizado.getProduto().getId() : oldProdutoId;

            // Se produto mudou, devolver estoque do antigo e reduzir do novo
            if (oldProdutoId != null && newProdutoId != null && !oldProdutoId.equals(newProdutoId)) {
                produtoService.aumentarEstoque(oldProdutoId, item.getQuantidade());
                if (!produtoService.verificarEstoque(newProdutoId, novoQuantidade)) {
                    throw new IllegalArgumentException("Estoque insuficiente para o novo produto id=" + newProdutoId);
                }
                produtoService.reduzirEstoque(newProdutoId, novoQuantidade);
            } else if (oldProdutoId != null) {
                int delta = novoQuantidade - item.getQuantidade();
                if (delta > 0) {
                    if (!produtoService.verificarEstoque(oldProdutoId, delta)) {
                        throw new IllegalArgumentException("Estoque insuficiente para aumentar quantidade do produto id=" + oldProdutoId);
                    }
                    produtoService.reduzirEstoque(oldProdutoId, delta);
                } else if (delta < 0) {
                    produtoService.aumentarEstoque(oldProdutoId, -delta);
                }
            }

            item.setQuantidade(novoQuantidade);
            item.setValorItem(novoValorItem);
            if (itemAtualizado.getProduto() != null) {
                item.setProduto(itemAtualizado.getProduto());
            }

            Item saved = itemRepository.save(item);

            // Atualiza total do pedido
            if (item.getPedido() != null && item.getPedido().getId() != null) {
                pedidoService.confirmarPedido(item.getPedido().getId());
            }

            return saved;
        }
        return null;
    }

    // Deletar item
    public void deletarItem(Long id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            Long produtoId = item.getProduto() != null ? item.getProduto().getId() : null;
            Long pedidoId = item.getPedido() != null ? item.getPedido().getId() : null;

            // Remove o item
            itemRepository.deleteById(id);

            // Restaura estoque do produto
            if (produtoId != null) {
                produtoService.aumentarEstoque(produtoId, item.getQuantidade());
            }

            // Recalcula total do pedido
            if (pedidoId != null) {
                pedidoService.confirmarPedido(pedidoId);
            }
        }
    }
}
