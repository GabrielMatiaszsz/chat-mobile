import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

const API_URL = "https://app-web-uniara-example-60f73cc06c77.herokuapp.com/equipamentos";

export default function App() {
  // Lista
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Formulário
  const [id, setId] = useState("");
  const [nome, setNome] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) {
        throw new Error(`GET falhou: ${res.status}`);
      }
      const data = await res.json();
      // Garante array
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Erro ao buscar", String(err?.message || err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const resetForm = () => {
    setId("");
    setNome("");
    setDisponivel(true);
  };

  const validar = () => {
    if (!id || isNaN(Number(id))) {
      Alert.alert("Validação", "Informe um ID numérico.");
      return false;
    }
    if (!nome.trim()) {
      Alert.alert("Validação", "Informe o nome do equipamento.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validar()) return;

    const payload = {
      id: Number(id),
      nome: nome.trim(),
      disponivel: Boolean(disponivel),
    };

    try {
      setSubmitting(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`POST falhou: ${res.status} ${errText}`);
      }

      // Atualiza lista e limpa formulário
      await fetchAll();
      resetForm();
      Alert.alert("Sucesso", "Equipamento cadastrado!");
    } catch (err) {
      Alert.alert("Erro ao cadastrar", String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>
          {item?.nome ?? "Sem nome"} <Text style={styles.muted}>#{item?.id}</Text>
        </Text>
        <Text style={[styles.badge, item?.disponivel ? styles.badgeOk : styles.badgeOff]}>
          {item?.disponivel ? "Disponível" : "Indisponível"}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Cadastro de Equipamentos</Text>
          <Text style={styles.subtitle}>GET & POST em {API_URL}</Text>

          {/* Formulário */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>ID (número)</Text>
              <TextInput
                value={id}
                onChangeText={setId}
                keyboardType="number-pad"
                placeholder="ex.: 2"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="ex.: martelo"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.field, styles.rowBetween]}>
              <Text style={styles.label}>Disponível</Text>
              <Switch value={disponivel} onValueChange={setDisponivel} />
            </View>

            <TouchableOpacity
              disabled={submitting}
              style={[styles.button, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lista */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Equipamentos Cadastrados</Text>
            <TouchableOpacity onPress={fetchAll} style={styles.linkBtn}>
              <Text style={styles.linkText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          {loadingList ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(it, idx) => String(it?.id ?? idx)}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.empty}>Nenhum equipamento cadastrado.</Text>
              }
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" }, // slate-900
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  subtitle: { color: "#cbd5e1", fontSize: 12, marginBottom: 12 }, // slate-300
  form: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  field: { gap: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 14, color: "#334155", fontWeight: "600" }, // slate-700
  input: {
    backgroundColor: "#f1f5f9", // slate-100
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    borderRadius: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#4f46e5", // indigo-600
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  listHeader: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1e293b" },
  linkText: { color: "#93c5fd", fontWeight: "600" },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  muted: { color: "#64748b", fontSize: 12 },
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  badgeOk: { backgroundColor: "#dcfce7", color: "#166534" }, // green
  badgeOff: { backgroundColor: "#fee2e2", color: "#991b1b" }, // red
  empty: { color: "#cbd5e1", textAlign: "center", marginTop: 12 },
});
