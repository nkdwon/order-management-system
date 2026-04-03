package com.ordermanagement.model;

import jakarta.persistence.Entity;

@Entity
public class ProdutoEletronico extends Produto {

  private int voltagem;

  public int getVoltagem() {
    return voltagem;
  }

  public void setVoltagem(int voltagem) {
    this.voltagem = voltagem;
  }
}