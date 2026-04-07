# Order Management System

Sistema de gestão de pedidos desenvolvido em Java com Spring Boot, Hibernate e MySQL.

### Enunciado 
![Enunciado do Projeto](./docs/enunciado.png)

*Imagem com o diagrama de classes e requisitos completos do projeto*


**Trabalho de Engenharia de Software II - PUC-Minas**

## 🚀 Como Rodar Local

Este projeto pode ser executado de duas formas:

1. **Somente front-end (modo demo, sem backend e sem banco)**
2. **Aplicação completa (Spring Boot + MySQL)**

---

### 1) Rodar Somente o Front-end (modo demo)

Use este modo quando quiser navegar pela interface sem configurar MySQL.

#### O que acontece nesse modo
- O arquivo `index.html` abre localmente no navegador.
- O `app.js` entra automaticamente em modo demo quando executado via `file://`.
- As rotas `/api` são simuladas em memória (dados de exemplo).

#### Como abrir

No Windows (PowerShell), dentro da pasta do projeto:

```powershell
Start-Process .\src\main\resources\static\index.html
```

Ou clique duas vezes no arquivo:

`src/main/resources/static/index.html`

---

### 2) Rodar Aplicação Completa (Backend + Banco)

#### Pré-requisitos
- Java 17+
- Maven 3.6+
- MySQL 5.7+ (ou MySQL 8+)

#### Passo a passo

1. **Subir MySQL** e garantir que a porta `3306` esteja ativa.

2. **Criar banco** (uma vez):

```sql
CREATE DATABASE IF NOT EXISTS order_management_system;
```

3. **Configurar credenciais** em `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/order_management_system
spring.datasource.username=root
spring.datasource.password=sua_senha
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

4. **Executar a aplicação**:

```bash
mvn clean install
mvn spring-boot:run
```

5. **Acessar no navegador**:

- App: `http://localhost:8080`

---

### Verificações Rápidas (Windows)

Verificar Java e Maven:

```powershell
java -version
mvn -version
```

Verificar se MySQL está ouvindo na porta 3306:

```powershell
netstat -ano | findstr :3306
```

---

### Problemas Comuns

#### Erro: `Unable to open JDBC Connection` / `Communications link failure`

Causa comum: MySQL desligado, credenciais inválidas ou porta incorreta.

Checklist:
- Confirme que o MySQL está ativo na porta `3306`.
- Valide `spring.datasource.username` e `spring.datasource.password`.
- Confirme que o banco `order_management_system` existe.

#### Front abre mas não carrega dados

- Se abriu por `index.html` local, isso é esperado no modo sem backend.
- Nesse caso, navegue normalmente usando o **modo demo**.
- Para dados reais, rode o backend com MySQL (seção 2).

#### Erro: `Web server failed to start. Port 8080 was already in use`

Causa comum: já existe outro processo usando a porta `8080`.

No Windows (PowerShell):

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID_ENCONTRADO> /F
```

Alternativa: subir em outra porta:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

## 📋 Funcionalidades

- ✅ Gestão de Pedidos (criar, listar, deletar)
- ✅ Gestão de Produtos (criar, listar, deletar)
- ✅ Gestão de Itens de Pedidos
- ✅ Herança de Produtos (Eletrônico, Perecível)
- ✅ Interface web responsiva

## 📁 Estrutura

```
src/main/java/com/ordermanagement/
├── model/              # Entidades JPA
├── repository/         # Repositórios
├── service/            # Serviços (Lógica)
└── controller/         # REST Controllers

src/main/resources/
├── templates/          # HTML (View)
├── static/
│   ├── style.css       # Estilos
│   └── app.js          # JavaScript
└── application.properties
```

## 🔌 APIs Disponíveis

### Pedidos
- `GET /api/pedidos` - Listar
- `POST /api/pedidos` - Criar
- `GET /api/pedidos/{id}` - Buscar por ID
- `PUT /api/pedidos/{id}` - Atualizar
- `DELETE /api/pedidos/{id}` - Deletar
- `POST /api/pedidos/{id}/confirmar` - Recalcular total

### Produtos
- `GET /api/produtos` - Listar
- `POST /api/produtos` - Criar
- `POST /api/produtos/eletronicos` - Criar eletrônico
- `POST /api/produtos/pereciveis` - Criar perecível
- `GET /api/produtos/{id}` - Buscar por ID
- `PUT /api/produtos/{id}` - Atualizar
- `DELETE /api/produtos/{id}` - Deletar
- `GET /api/produtos/{id}/estoque/{quantidade}` - Verificar estoque
- `PUT /api/produtos/{id}/reduzir-estoque/{quantidade}` - Reduzir estoque

### Itens
- `GET /api/itens` - Listar
- `POST /api/itens` - Criar
- `GET /api/itens/{id}` - Buscar por ID
- `PUT /api/itens/{id}` - Atualizar
- `DELETE /api/itens/{id}` - Deletar

## 📝 Tecnologias

- **Backend**: Spring Boot 3.2.5, Hibernate, MySQL
- **Frontend**: HTML5, CSS3, JavaScript (Fetch API)
- **Database**: MySQL 5.7+
- **Build**: Maven

## Autores

- **Felipe Barros**
- **Vitor Gomes**