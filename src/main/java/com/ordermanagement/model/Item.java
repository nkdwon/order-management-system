package com.ordermanagement.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
public class Item {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private Integer quantidade;

  private Double valorItem;

  @ManyToOne
  @JoinColumn(name = "pedido_id")
  @JsonBackReference
  private Pedido pedido;

  @ManyToOne
  @JoinColumn(name = "produto_id")
  private Produto produto;

  public Long getId() {
    return id;
  }

  public Integer getQuantidade() {
    return quantidade;
  }

  public void setQuantidade(Integer quantidade) {
    this.quantidade = quantidade;
  }

  public Double getValorItem() {
    return valorItem;
  }

  public void setValorItem(Double valorItem) {
    this.valorItem = valorItem;
  }

  public Pedido getPedido() {
    return pedido;
  }

  public Produto getProduto() {
    return produto;
  }

  public void setProduto(Produto produto) {
    this.produto = produto;
  }

  public void setPedido(Pedido pedido) {
    this.pedido = pedido;
  }
}
