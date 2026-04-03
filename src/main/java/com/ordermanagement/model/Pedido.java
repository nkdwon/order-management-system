package com.ordermanagement.model;

import jakarta.persistence.*;
import java.util.List;

import com.ordermanagement.model.Item;

@Entity
public class Pedido {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String data;
  private double valorTotal;

  @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
  private List<Item> itens;

  // id
  public Long getId() {
    return id;
  }

  // data
  public String getData() {
    return data;
  }

  public void setData(String data) {
    this.data = data;
  }

  // valorTotal
  public double getValorTotal() {
    return valorTotal;
  }

  public void setValorTotal(double valorTotal) {
    this.valorTotal = valorTotal;
  }

  // itens
  public List<Item> getItens() {
    return itens;
  }

  public void setItens(List<Item> itens) {
    this.itens = itens;
  }
}