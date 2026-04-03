package com.ordermanagement.service;

import com.ordermanagement.model.Item;
import com.ordermanagement.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    // Criar novo item
    public Item criarItem(Item item) {
        return itemRepository.save(item);
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
            if (itemAtualizado.getQuantidade() > 0) {
                item.setQuantidade(itemAtualizado.getQuantidade());
            }
            if (itemAtualizado.getValorItem() > 0) {
                item.setValorItem(itemAtualizado.getValorItem());
            }
            if (itemAtualizado.getProduto() != null) {
                item.setProduto(itemAtualizado.getProduto());
            }
            return itemRepository.save(item);
        }
        return null;
    }

    // Deletar item
    public void deletarItem(Long id) {
        itemRepository.deleteById(id);
    }
}
