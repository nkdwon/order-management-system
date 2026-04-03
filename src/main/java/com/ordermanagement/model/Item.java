package com.ordermanagement.model;

import jakarta.persistence.*;

@Entity
public class Item {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private int quantidade;
  private double valorItem;

  @ManyToOne
  private Produto produto;

  @ManyToOne
  private Pedido pedido;

  // id
  public Long getId() {
    return id;
  }

  // quantidade
  public int getQuantidade() {
    return quantidade;
  }

  public void setQuantidade(int quantidade) {
    this.quantidade = quantidade;
  }

  // valorItem
  public double getValorItem() {
    return valorItem;
  }

  public void setValorItem(double valorItem) {
    this.valorItem = valorItem;
  }

  // produto
  public Produto getProduto() {
    return produto;
  }

  public void setProduto(Produto produto) {
    this.produto = produto;
  }

  // pedido
  public Pedido getPedido() {
    return pedido;
  }

  public void setPedido(Pedido pedido) {
    this.pedido = pedido;
  }
}
