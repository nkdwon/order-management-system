package com.ordermanagement.model;

import jakarta.persistence.Entity;
import java.time.LocalDate;

@Entity
public class ProdutoPerecivel extends Produto {

    private LocalDate dataValidade;

    public LocalDate getDataValidade() {
        return dataValidade;
    }

    public void setDataValidade(LocalDate dataValidade) {
        this.dataValidade = dataValidade;
    }
}
