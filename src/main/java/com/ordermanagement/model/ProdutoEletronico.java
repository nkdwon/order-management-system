package com.ordermanagement.model;

import jakarta.persistence.Entity;

@Entity
public class ProdutoEletronico extends Produto {

    private Integer voltagem;

    public Integer getVoltagem() {
        return voltagem;
    }

    public void setVoltagem(Integer voltagem) {
        this.voltagem = voltagem;
    }
}
