# App React Native — Cadastro de Equipamentos (GET/POST + Lista)

> Projeto educacional para a disciplina de **Sistemas de Informação**. Um app simples em **React Native** (recomendado com **Expo**) que consome uma **API REST** para **listar** e **cadastrar** equipamentos.

<p align="center">
  <strong>Aprenda na prática:</strong> Estado (<code>useState</code>) • Efeitos (<code>useEffect</code>) • Funções memorizadas (<code>useCallback</code>) • HTTP (GET/POST) • JSON • UX básica
</p>

---

## 📚 Sumário
- [Objetivo](#-objetivo)
- [Como funciona](#-como-funciona)
- [Endpoint e payload](#-endpoint-e-payload)
- [Conceitos teóricos essenciais](#-conceitos-teóricos-essenciais)
- [Fluxo do código (passo a passo)](#-fluxo-do-código-passo-a-passo)
- [Interface (componentes usados)](#-interface-componentes-usados)
- [Validações do formulário](#-validações-do-formulário)
- [Como rodar com Expo](#-como-rodar-com-expo)
- [Testes rápidos com curl](#-testes-rápidos-com-curl)
- [Erros comuns e correções](#-erros-comuns-e-correções)
- [Boas práticas aplicadas](#-boas-práticas-aplicadas)
- [Exercícios sugeridos](#-exercícios-sugeridos)
- [Checklist de aprendizado](#-checklist-de-aprendizado)
- [FAQ](#-faq)
- [Licença e créditos](#-licença-e-créditos)

---

## 🎯 Objetivo

Demonstrar um CRUD **parcial** (listar + criar) com **UX básica**, usando **hooks** do React e consumindo uma **API REST** com **JSON**. O código é ideal para aulas introdutórias de **desenvolvimento mobile** e **consumo de APIs**.

---

## 🧭 Como funciona

- A tela mostra um **formulário** (ID, Nome, Disponível) e o botão **Cadastrar**.
- Ao enviar, o app faz um **POST** para a API.
- Em seguida, realiza um **GET** para **atualizar a lista**.
- A lista suporta **pull-to-refresh**, exibe **loading** e mensagens de **sucesso/erro**.

Fluxo resumido:
```
Usuário preenche → Validação → POST /equipamentos → Sucesso → GET /equipamentos → Lista atualizada
```

---

## 🔌 Endpoint e payload

**Endpoint (GET e POST):**
```
https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos
```

**Exemplo de corpo (POST):**
```json
{
  "id": 2,
  "nome": "martelo",
  "disponivel": true
}
```

---

## 🧠 Conceitos teóricos essenciais

### Estado (`useState`)
- **O que é:** “memória” do componente. Ao mudar, a UI é **re-renderizada**.
- **No app:** `items`, `loadingList`, `refreshing`, `id`, `nome`, `disponivel`, `submitting`.

### Efeitos (`useEffect`)
- **O que é:** código que roda **após** a renderização inicial ou quando dependências mudam.
- **No app:** `useEffect` chama `fetchAll()` na montagem para realizar o **GET** inicial.

### Funções memorizadas (`useCallback`)
- **O que é:** mantém a **mesma referência** de função entre renderizações (evita recriações desnecessárias).
- **No app:** `fetchAll` e `onRefresh` são criadas com `useCallback`.

### HTTP (GET/POST) e códigos de status
- **GET:** buscar dados. **POST:** criar recurso no servidor.
- **2xx:** sucesso • **4xx:** erro do cliente • **5xx:** erro do servidor.

### JSON
- Formato leve de troca de dados entre cliente e servidor.
- **No app:** `JSON.stringify(payload)` (enviar) e `res.json()` (ler resposta).

---

## 🗺️ Fluxo do código (passo a passo)

1. **Montagem**: `useEffect` → `fetchAll()` → **GET** → resultado em `items`.
2. **Formulário**: usuário altera `id`, `nome`, `disponivel`.
3. **Cadastrar**: `handleSubmit()` valida, faz **POST**, chama `fetchAll()`, limpa o formulário e mostra sucesso.
4. **Atualizar lista**: botão “Atualizar” ou **pull-to-refresh** chamam `fetchAll()`.

---

## 🧩 Interface (componentes usados)

- **`SafeAreaView`**: respeita notch e status bar.
- **`View`, `Text`**: estrutura e textos.
- **`TextInput`**: entradas de **ID** e **Nome**.
- **`Switch`**: alterna o booleano **Disponível**.
- **`TouchableOpacity`**: botão **Cadastrar**.
- **`FlatList`**: lista performática.
- **`RefreshControl`**: “puxe para atualizar”.
- **`ActivityIndicator`**: indicador de carregamento.
- **`Alert`**: mensagens simples ao usuário.
- **`KeyboardAvoidingView`**: evita que o teclado cubra campos (iOS).
- **`StyleSheet`**: estilos centralizados.

---

## ✅ Validações do formulário

1. **ID** deve ser **numérico** (`isNaN(Number(id))` → inválido).  
2. **Nome** não pode ser vazio (`!nome.trim()` → inválido).  
3. **Disponível** é booleano (controlado pelo `Switch`).  
4. Em qualquer falha → `Alert.alert("Validação", "...")`.

---

## ▶️ Como rodar com Expo

**Pré-requisitos:** Node.js LTS; app **Expo Go** no celular.

```bash
# 1) Criar um projeto (se ainda não existir)
npx create-expo-app cadastro-equipamentos

# 2) Substituir o App.js pelo código deste repositório

# 3) Instalar dependências (se necessário)
npm install

# 4) Rodar em desenvolvimento
npx expo start

# 5) Instalar Modulo Web
npx expo install react-dom react-native-web @expo/metro-runtime
```

- Abra no celular (Expo Go) lendo o QR Code ou use simulador Android/iOS.

> Se optar por React Native CLI, siga a documentação oficial para configurar Android/iOS.

---

## 🧪 Testes rápidos com curl

**GET — listar:**
```bash
curl -X GET https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos
```

**POST — cadastrar:**
```bash
curl -X POST https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos \
  -H "Content-Type: application/json" \
  -d '{"id": 2, "nome": "martelo", "disponivel": true}'
```

> Após o POST, o app chama `fetchAll()` e a lista é atualizada automaticamente.

---

## 🐞 Erros comuns e correções

### 1) Template literals nas mensagens de erro
Use **crases** (`` ` ``) para interpolar variáveis em strings:

```diff
- throw new Error(GET falhou: ${res.status});
+ throw new Error(`GET falhou: ${res.status}`);

- throw new Error(POST falhou: ${res.status} ${errText});
+ throw new Error(`POST falhou: ${res.status} ${errText}`);
```

### 2) Lista não atualiza
- Verifique o endpoint e a conectividade.
- Teste o **GET** via curl/Postman.
- Confirme `setItems(Array.isArray(data) ? data : [])`.

### 3) CORS no Web
- Prefira testar no **device** com **Expo Go** ou ajuste CORS no servidor.

### 4) Teclado cobrindo campos (iOS)
- `KeyboardAvoidingView` com `behavior="padding"` ajuda.

---

## 🧭 Boas práticas aplicadas

- `useCallback` em `fetchAll` e `onRefresh` para referência estável.
- `try/catch/finally` para ligar/desligar **loading** e tratar erros com clareza.
- **Feedbacks amigáveis** (`Alert`) e UI consistente (cards, badges, botões).

---

## 🧑‍🏫 Exercícios sugeridos

1. **PUT (editar)** um equipamento existente.  
2. **DELETE (remover)** um equipamento.  
3. **Busca e ordenação** por `nome`.  
4. **Validação de ID duplicado** antes do POST.  
5. Trocar `Alert` por **Toast/Snackbar**.  
6. **Paginação**/infinite scroll na `FlatList`.  
7. **Modal** para confirmar exclusão.

> Se a API não suportar PUT/DELETE, crie uma API mock com **json-server** localmente.

---

## ☑️ Checklist de aprendizado

- [ ] Entendi **estado** e **re-renderização**.  
- [ ] Sei quando usar **useEffect** e **useCallback**.  
- [ ] Diferencio **GET** e **POST**.  
- [ ] Sei montar e consumir **JSON**.  
- [ ] Valido inputs e mostro **erros**.  
- [ ] Ligo/desligo **loading** corretamente.  
- [ ] Rodei o projeto com **Expo**.

---

## ❓ FAQ

**Funciona offline?** Não. Depende da API remota.  
**Posso trocar a API?** Sim. Ajuste `API_URL` e mantenha o mesmo formato JSON.  
**Por que usar `useCallback`?** Para manter a função estável e evitar efeitos colaterais em `useEffect`.  
**Posso usar TypeScript?** Sim. Ajuda a prevenir erros de tipo.

---

## 📄 Licença e créditos

Uso livre para fins educacionais.  
Material preparado para turmas de **Sistemas de Informação**, praticando **APIs REST** em apps móveis com **React Native**.
