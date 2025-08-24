# App React Native — **Chat entre Pessoas** (usando `/equipamentos`)

Projeto educacional que transforma a API de **Cadastro de Equipamentos** em um **chat simples** entre duas pessoas — **sem alterar a API**.  
As mensagens são persistidas em `/equipamentos` usando o campo `nome` para armazenar, como **string**, um JSON com `{ from, to, text, createdAt }`. O campo `disponivel` é mantido para respeitar o schema.

> **Por quê?** A API não pode ser modificada. Então “guardamos” cada mensagem dentro de `nome` (string) e usamos um `id` numérico de 6 dígitos para evitar `400 Bad Request`.

---

## 🎯 Objetivo

Demonstrar um chat 1–1 (usuário ↔ contato) com:
- **GET** para listar mensagens (lidas de `/equipamentos`, filtradas no app)
- **POST** para enviar novas mensagens (gravadas como JSON dentro de `nome`)
- **Polling** leve (atualização periódica)
- **Atualização otimista** (mensagem aparece antes da confirmação do servidor)
- **UX** de chat (bubbles, composer, refresh, loading)

---

## 🧭 Como funciona (fluxo)

1. Usuário define **seu nome** (`me`) e o **contato** (`peer`).
2. O app faz **GET /equipamentos**, converte `nome` em JSON e **filtra** apenas as mensagens da dupla (`me` ⇄ `peer`).
3. Ao enviar, o app faz **POST /equipamentos** com:
   - `id`: número de 6 dígitos (p.ex. `123456`)
   - `nome`: **string** com JSON da mensagem
   - `disponivel`: `true` (mantido para bater com o schema)
4. Após o POST, o app refaz o GET e atualiza a conversa.

> Como a API não tem filtro por usuário, **todo o histórico é global** e o **filtro é feito no cliente** (por `from`/`to`).

---

## 🔌 Endpoint (inalterado) & mapeamento

**Endpoint único (GET e POST):**
```
https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos
```

**Mapeamento de dados (adaptação para chat):**

| Campo API    | Uso no chat                                                    |
|--------------|----------------------------------------------------------------|
| `id`         | ID numérico da “mensagem” (6 dígitos, p.ex. 123456)            |
| `nome`       | **String** contendo JSON: `{"from","to","text","createdAt"}`   |
| `disponivel` | Mantido como `true` (compatibilidade com a API)                |

**Exemplo de payload (POST):**
```json
{
  "id": 123456,
  "nome": "{\"from\":\"gabriel\",\"to\":\"alice\",\"text\":\"oi\",\"createdAt\":\"2025-08-24T17:00:00.000Z\}",
  "disponivel": true
}
```

---

## 🧪 Testes rápidos com `curl`

**GET — listar tudo**
```bash
curl -X GET https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos
```

**POST — enviar mensagem (note o `nome` com JSON escapado)**
```bash
curl -X POST https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos   -H "Content-Type: application/json"   -d '{"id":123456,"nome":"{\"from\":\"gabriel\",\"to\":\"alice\",\"text\":\"oi\",\"createdAt\":\"2025-08-24T17:00:00.000Z\"}","disponivel":true}'
```

Após o POST, o app chama `fetchAll()` e a conversa é atualizada.

---

## 🖥️ Interface & UX

- **Cabeçalho**: campos “Seu nome” e “Contato”.
- **Lista**: bolhas (bubbles) alinhadas à direita/esquerda (quem enviou).
- **Composer**: campo de texto + botão **Enviar**.
- **Pull-to-refresh** e **loading**.
- **Polling** (~3,5s) para trazer novas mensagens.
- **Atualização otimista** ao enviar (feedback instantâneo).

---

## 🧩 Conceitos técnicos no código

- **Hooks**: `useState`, `useEffect`, `useCallback`, `useMemo`.
- **HTTP**: `fetch` com `GET`/`POST` e `Content-Type: application/json`.
- **Serialização**: `JSON.stringify` para gravar o JSON dentro de `nome`.
- **Ordenação**: por `createdAt` e desempate por `id`.
- **Filtro**: cliente filtra por `from/to` da dupla ativa.

---

## ▶️ Como rodar com Expo

Pré-requisitos: Node.js LTS e **Expo Go** no celular.

```bash
# 1) Criar projeto (se necessário)
npx create-expo-app rn-chat-equipamentos

# 2) Substituir o App.js pelo código deste repositório

# 3) Instalar dependências (se necessário)
npm install

# 4) Rodar
npx expo start

# (opcional Web)
npx expo install react-dom react-native-web @expo/metro-runtime
```

Abra no celular (Expo Go) via QR Code, ou use emulador Android/iOS.

---

## 🐞 Erros comuns & correções

1) **400 Bad Request (POST)**  
   Use **ID pequeno (6 dígitos)**. `Date.now()` (13 dígitos) pode estourar `INT32`.

2) **Network request failed**  
   - Teste a URL no **mesmo dispositivo** que roda o app.  
   - Em Android emulador local, use `http://10.0.2.2:<porta>` (não `localhost`).  
   - Prefira **HTTPS válido** (a API do projeto já é HTTPS).

3) **`nome` não é JSON**  
   Registros antigos de equipamentos podem existir. O app **ignora** entradas cujo `nome` não seja JSON de mensagem.

4) **Ordem incorreta**  
   Garanta que `createdAt` está em **ISO** (`new Date().toISOString()`).

---

## 🧭 Boas práticas aplicadas

- `useCallback`/`useMemo` para estabilidade e performance.
- Tratamento de erros com `try/catch/finally` + feedback ao usuário.
- **Polling** controlado e **atualização otimista**.
- Filtro no cliente sem exigir mudanças na API.

---

## 🗺️ Roadmap (ideias)

- Auto-scroll para a última mensagem.  
- Inverter a FlatList (mais recentes no fim).  
- Indicação de “enviando/entregue”.  
- Avatares iniciais (letra do nome).  
- Migrar para uma API real de mensagens quando possível.

---

## 📄 Licença & créditos

Uso livre para fins educacionais.  
Projeto preparado para aulas de **Sistemas de Informação**, praticando consumo de **APIs REST** em apps móveis com **React Native/Expo**, mesmo quando a API não foi desenhada para o caso de uso final.
