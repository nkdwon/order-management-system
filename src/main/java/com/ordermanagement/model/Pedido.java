package com.ordermanagement.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Pedido {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private LocalDate data;

  private Double valorTotal = 0.0;

  @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<Item> itens = new ArrayList<>();

  public Pedido() {
    this.data = LocalDate.now();
  }

  public Long getId() {
    return id;
  }

  public LocalDate getData() {
    return data;
  }

  public void setData(LocalDate data) {
    this.data = data;
  }

  public Double getValorTotal() {
    return valorTotal;
  }

  public List<Item> getItens() {
    return itens;
  }

  public void setValorTotal(Double valorTotal) {
    this.valorTotal = valorTotal;
  }

  public void setItens(List<Item> itens) {
    this.itens.clear();
    if (itens != null) {
      for (Item item : itens) {
        adicionarItem(item);
      }
    }
    calcularTotal();
  }

  public void adicionarItem(Item item) {
    item.setPedido(this);
    this.itens.add(item);
    calcularTotal();
  }

  public void removerItem(Item item) {
    if (item != null) {
      item.setPedido(null);
      this.itens.remove(item);
      calcularTotal();
    }
  }

  public void calcularTotal() {
    this.valorTotal = itens.stream()
        .mapToDouble(item -> item.getQuantidade() * item.getValorItem())
        .sum();
  }
}
