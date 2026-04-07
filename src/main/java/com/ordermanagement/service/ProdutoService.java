package com.ordermanagement.service;

import com.ordermanagement.model.Produto;
import com.ordermanagement.repository.ItemRepository;
import com.ordermanagement.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Transactional
    public Produto criarProduto(Produto produto) {
        validarProduto(produto);
        return produtoRepository.save(produto);
    }

    public List<Produto> listarTodos() {
        return produtoRepository.findAll();
    }

    public Optional<Produto> buscarPorId(Long id) {
        return produtoRepository.findById(id);
    }

    @Transactional
    public Produto atualizarProduto(Long id, Produto produtoAtualizado) {
        Optional<Produto> produtoExistente = produtoRepository.findById(id);
        if (produtoExistente.isPresent()) {
            Produto produto = produtoExistente.get();
            if (produtoAtualizado.getNome() != null) {
                produto.setNome(produtoAtualizado.getNome());
            }
            if (produtoAtualizado.getPreco() != null) {
                produto.setPreco(produtoAtualizado.getPreco());
            }
            if (produtoAtualizado.getEstoque() != null) {
                produto.setEstoque(produtoAtualizado.getEstoque());
            }

            validarProduto(produto);
            return produtoRepository.save(produto);
        }
        return null;
    }

    @Transactional
    public void deletarProduto(Long id) {
        if (itemRepository.existsByProdutoId(id)) {
            throw new IllegalArgumentException(
                    "Não é possível excluir produto que já está vinculado a itens de pedido");
        }
        produtoRepository.deleteById(id);
    }

    public boolean verificarEstoque(Long id, int quantidade) {
        Optional<Produto> produto = produtoRepository.findById(id);
        if (produto.isPresent()) {
            return produto.get().getEstoque() >= quantidade;
        }
        return false;
    }

    @Transactional
    public void reduzirEstoque(Long id, int quantidade) {
        Produto produto = buscarEntidade(id);
        if (quantidade < 0) {
            throw new IllegalArgumentException("Quantidade para reduzir estoque deve ser positiva");
        }

        if (produto.getEstoque() < quantidade) {
            throw new IllegalArgumentException("Estoque insuficiente para o produto id=" + id);
        }

        produto.setEstoque(produto.getEstoque() - quantidade);
        produtoRepository.save(produto);
    }

    @Transactional
    public void aumentarEstoque(Long id, int quantidade) {
        Produto produto = buscarEntidade(id);
        if (quantidade < 0) {
            throw new IllegalArgumentException("Quantidade para aumentar estoque deve ser positiva");
        }

        produto.setEstoque(produto.getEstoque() + quantidade);
        produtoRepository.save(produto);
    }

    public Produto buscarEntidade(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado: id=" + id));
    }

    private void validarProduto(Produto produto) {
        if (produto == null) {
            throw new IllegalArgumentException("Produto inválido");
        }
        if (produto.getNome() == null || produto.getNome().isBlank()) {
            throw new IllegalArgumentException("Nome do produto é obrigatório");
        }
        if (produto.getPreco() == null || produto.getPreco() <= 0) {
            throw new IllegalArgumentException("Preço deve ser maior que zero");
        }
        if (produto.getEstoque() == null || produto.getEstoque() < 0) {
            throw new IllegalArgumentException("Estoque deve ser zero ou positivo");
        }
    }
}
