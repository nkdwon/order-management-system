package com.ordermanagement.controller;

import com.ordermanagement.model.Item;
import com.ordermanagement.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    @Autowired
    private ItemService itemService;

    // POST - Criar novo item
    @PostMapping
    public ResponseEntity<Item> criarItem(@RequestBody Item item) {
        Item novoItem = itemService.criarItem(item);
        return new ResponseEntity<>(novoItem, HttpStatus.CREATED);
    }

    // GET - Listar todos os itens
    @GetMapping
    public ResponseEntity<List<Item>> listarTodos() {
        List<Item> itens = itemService.listarTodos();
        return new ResponseEntity<>(itens, HttpStatus.OK);
    }

    // GET - Buscar item por ID
    @GetMapping("/{id}")
    public ResponseEntity<Item> buscarPorId(@PathVariable Long id) {
        Optional<Item> item = itemService.buscarPorId(id);
        return item.map(i -> new ResponseEntity<>(i, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // PUT - Atualizar item
    @PutMapping("/{id}")
    public ResponseEntity<Item> atualizarItem(@PathVariable Long id, @RequestBody Item item) {
        Item itemAtualizado = itemService.atualizarItem(id, item);
        if (itemAtualizado != null) {
            return new ResponseEntity<>(itemAtualizado, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // DELETE - Deletar item
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarItem(@PathVariable Long id) {
        Optional<Item> item = itemService.buscarPorId(id);
        if (item.isPresent()) {
            itemService.deletarItem(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
