package com.ordermanagement.service;

import com.ordermanagement.model.Produto;
import com.ordermanagement.model.ProdutoEletronico;
import com.ordermanagement.model.ProdutoPerecivel;
import com.ordermanagement.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepository;

    // Criar novo produto
    public Produto criarProduto(Produto produto) {
        return produtoRepository.save(produto);
    }

    // Listar todos os produtos
    public List<Produto> listarTodos() {
        return produtoRepository.findAll();
    }

    // Buscar produto por ID
    public Optional<Produto> buscarPorId(Long id) {
        return produtoRepository.findById(id);
    }

    // Atualizar produto
    public Produto atualizarProduto(Long id, Produto produtoAtualizado) {
        Optional<Produto> produtoExistente = produtoRepository.findById(id);
        if (produtoExistente.isPresent()) {
            Produto produto = produtoExistente.get();
            if (produtoAtualizado.getNome() != null) {
                produto.setNome(produtoAtualizado.getNome());
            }
            if (produtoAtualizado.getPreco() > 0) {
                produto.setPreco(produtoAtualizado.getPreco());
            }
            if (produtoAtualizado.getEstoque() >= 0) {
                produto.setEstoque(produtoAtualizado.getEstoque());
            }
            return produtoRepository.save(produto);
        }
        return null;
    }

    // Deletar produto
    public void deletarProduto(Long id) {
        produtoRepository.deleteById(id);
    }

    // Verificar estoque
    public boolean verificarEstoque(Long id, int quantidade) {
        Optional<Produto> produto = produtoRepository.findById(id);
        if (produto.isPresent()) {
            return produto.get().getEstoque() >= quantidade;
        }
        return false;
    }

    // Reduzir estoque
    public void reduzirEstoque(Long id, int quantidade) {
        Optional<Produto> produto = produtoRepository.findById(id);
        if (produto.isPresent()) {
            Produto p = produto.get();
            p.setEstoque(p.getEstoque() - quantidade);
            produtoRepository.save(p);
        }
    }
}
