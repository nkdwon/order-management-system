package com.ordermanagement.model;

import jakarta.persistence.Entity;

@Entity
public class ProdutoPerecivel extends Produto {

  private String dataValidade;

  // dataValidade
  public String getDataValidade() {
    return dataValidade;
  }

  public void setDataValidade(String dataValidade) {
    this.dataValidade = dataValidade;
  }


}