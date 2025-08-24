// App.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
} from "react-native";

const API_URL = "https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos";
const POLL_MS = 3500;

/* ---------------- helpers ---------------- */
function makeId(existingIds = new Set()) {
  // 6 dígitos (cabe em int32 e evita 400)
  let id;
  let tries = 0;
  do {
    id = Math.floor(100000 + Math.random() * 900000);
    tries++;
  } while (existingIds.has(id) && tries < 8);
  return id;
}

function encodeMsg({ from, to, text, createdAt }) {
  return JSON.stringify({ from, to, text, createdAt });
}

function tryParseMsg(equip) {
  // equip = { id, nome, disponivel }
  try {
    const obj = JSON.parse(equip?.nome ?? "");
    if (obj && typeof obj === "object" && obj.text && obj.from && obj.to) {
      return {
        id: equip.id,
        from: String(obj.from),
        to: String(obj.to),
        text: String(obj.text),
        createdAt: obj.createdAt ?? new Date().toISOString(),
        _raw: equip,
      };
    }
  } catch (_) {
    // nome não é JSON -> ignorar (registro antigo de "equipamento")
  }
  return null;
}

/* ---------------- App ---------------- */
export default function App() {
  // “Nome de pessoas” usados como identificadores do chat
  const [me, setMe] = useState("gabriel");
  const [peer, setPeer] = useState("alice");

  // mensagens
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // composer
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const canChat = useMemo(() => me.trim() && peer.trim(), [me, peer]);

  // ids já usados (evita colisão ao gerar novo id)
  const existingIds = useMemo(
    () => new Set(messages.map((m) => Number(m.id)).filter((n) => !Number.isNaN(n))),
    [messages]
  );

  const fetchAll = useCallback(async () => {
    try {
      setLoadingList((prev) => prev || messages.length === 0);
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) throw new Error(`GET falhou: ${res.status}`);

      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      // converte -> filtra por dupla -> ordena cronologicamente
      const parsed = arr
        .map(tryParseMsg)
        .filter(Boolean)
        .filter((m) => {
          const a = String(m.from),
            b = String(m.to);
          const x = String(me),
            y = String(peer);
          return (a === x && b === y) || (a === y && b === x);
        })
        .sort((a, b) => {
          const ta = new Date(a.createdAt).getTime() || 0;
          const tb = new Date(b.createdAt).getTime() || 0;
          if (ta !== tb) return ta - tb;
          return Number(a.id) - Number(b.id);
        });

      setMessages(parsed);
    } catch (err) {
      Alert.alert("Erro ao buscar", String(err?.message || err));
    } finally {
      setLoadingList(false);
    }
  }, [me, peer, messages.length]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // polling leve
  useEffect(() => {
    if (!canChat) return;
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [canChat, fetchAll]);

  const sendMessage = useCallback(async () => {
    const txt = text.trim();
    if (!txt) return;
    if (!canChat) {
      Alert.alert("Informação", "Informe seu nome e o contato para iniciar o chat.");
      return;
    }

    const createdAt = new Date().toISOString();
    const newId = makeId(existingIds);

    const equipPayload = {
      id: newId,
      nome: encodeMsg({ from: me, to: peer, text: txt, createdAt }),
      disponivel: true, // mantém o schema original da API
    };

    // mensagem otimista
    const optimistic = {
      id: newId,
      from: me,
      to: peer,
      text: txt,
      createdAt,
      _optimistic: true,
    };

    try {
      setSending(true);
      setMessages((prev) => [...prev, optimistic]);
      setText("");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipPayload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`POST falhou: ${res.status} ${errText}`);
      }

      // refaz GET para substituir otimista pela versão persistida
      await fetchAll();
    } catch (err) {
      // rollback
      setMessages((prev) => prev.filter((m) => Number(m.id) !== Number(optimistic.id)));
      Alert.alert("Erro ao enviar", String(err?.message || err));
    } finally {
      setSending(false);
    }
  }, [text, canChat, me, peer, existingIds, fetchAll]);

  const renderItem = ({ item }) => {
    const isMine = String(item.from) === String(me);
    const time = (() => {
      const d = new Date(item.createdAt);
      return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    })();

    return (
      <View style={[styles.bubbleRow, isMine ? styles.right : styles.left]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && { color: "#fff" }]}>{item.text}</Text>
          <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Chat de Pessoas</Text>
          <Text style={styles.subtitle}>
            API intacta: GET/POST em /equipamentos (campo "nome" carrega o JSON da mensagem)
          </Text>

          {/* sessão */}
          <View style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Seu nome</Text>
                <TextInput
                  value={me}
                  onChangeText={setMe}
                  placeholder="ex.: gabriel"
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Contato</Text>
                <TextInput
                  value={peer}
                  onChangeText={setPeer}
                  placeholder="ex.: alice"
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.sessionActions}>
              <TouchableOpacity onPress={fetchAll} style={styles.linkBtn}>
                <Text style={styles.linkText}>Atualizar</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.sessionHint}>Polling</Text>
                <Switch value disabled />
              </View>
            </View>
          </View>

          {/* mensagens */}
          <View style={styles.listWrap}>
            {loadingList ? (
              <ActivityIndicator style={{ marginTop: 8 }} />
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(it, idx) => String(it?.id ?? idx)}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.empty}>Nenhuma mensagem ainda. Diga um “oi”! 👋</Text>}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
            )}
          </View>

          {/* composer */}
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escreva uma mensagem…"
              style={styles.composerInput}
              multiline
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={sending || !text.trim()}
              style={[styles.sendBtn, (sending || !text.trim()) && { opacity: 0.6 }]}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Enviar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" }, // slate-900
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "white", marginBottom: 4 },
  subtitle: { color: "#cbd5e1", fontSize: 12, marginBottom: 12 },

  sessionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  sessionRow: { flexDirection: "row" },
  sessionActions: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionHint: { color: "#334155", fontSize: 12 },

  label: { fontSize: 14, color: "#334155", fontWeight: "600" },
  input: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
  },

  listWrap: {
    flex: 1,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: "#0b1220",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  empty: { color: "#cbd5e1", textAlign: "center", marginTop: 12 },

  bubbleRow: { flexDirection: "row", marginVertical: 4 },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: { maxWidth: "82%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleMine: { backgroundColor: "#4f46e5", borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: "#e5e7eb", borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 16, color: "#0f172a" },
  time: { fontSize: 11, marginTop: 4 },
  timeMine: { color: "rgba(255,255,255,0.85)", textAlign: "right" },
  timeTheirs: { color: "#475569" },

  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingVertical: 8 },
  composerInput: {
    flex: 1,
    maxHeight: 140,
    minHeight: 44,
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0f172a",
  },
  sendBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  linkBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1e293b" },
  linkText: { color: "#93c5fd", fontWeight: "600" },
});
