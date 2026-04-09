import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getFavoriteId, makeDisplayLabel } from "../lib/search";
import type { Favorite } from "../types/favorite";

type Props = {
  currentFavoriteId: string | null;
  favorites: Favorite[];
  onBack: () => void;
  onDelete: (favoriteId: string) => void;
  onMove: (favoriteId: string, direction: -1 | 1) => void;
  onSelectCurrentFavorite: (favoriteId: string) => void;
};

export function FavoritesScreen({
  currentFavoriteId,
  favorites,
  onBack,
  onDelete,
  onMove,
  onSelectCurrentFavorite,
}: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backLabel}>뒤로</Text>
        </Pressable>
        <Text style={styles.title}>즐겨찾기 관리</Text>
        <View style={styles.placeholder} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🚇</Text>
          <Text style={styles.emptyTitle}>즐겨찾기가 없습니다</Text>
          <Text style={styles.emptyText}>검색 화면에서 최대 5개까지 추가할 수 있습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {favorites.map((item, index) => {
            const favoriteId = getFavoriteId(item);
            const selected = favoriteId === currentFavoriteId;

            return (
              <View
                key={favoriteId}
                style={[styles.row, selected ? styles.rowSelected : null, selected ? styles.rowSelectedAccent : null]}
              >
                <Pressable
                  onPress={() => onSelectCurrentFavorite(favoriteId)}
                  style={styles.rowBody}
                >
                  <Text style={styles.rowTitle}>
                    {makeDisplayLabel(item.stationName, item.lineName, item.directionLabel)}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {selected ? "현재 기준 즐겨찾기" : "누르면 현재 기준으로 선택됩니다"}
                  </Text>
                </Pressable>

                <View style={styles.rowActions}>
                  <View style={styles.moveButtons}>
                    <Pressable
                      disabled={index === 0}
                      onPress={() => onMove(favoriteId, -1)}
                      style={[
                        styles.moveButton,
                        index === 0 ? styles.disabledButton : null,
                      ]}
                    >
                      <Text style={styles.moveLabel}>↑</Text>
                    </Pressable>
                    <Pressable
                      disabled={index === favorites.length - 1}
                      onPress={() => onMove(favoriteId, 1)}
                      style={[
                        styles.moveButton,
                        index === favorites.length - 1 ? styles.disabledButton : null,
                      ]}
                    >
                      <Text style={styles.moveLabel}>↓</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => onDelete(favoriteId)} style={styles.deleteButton}>
                    <Text style={styles.deleteLabel}>삭제</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3efe4",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e5dcc8",
  },
  backLabel: {
    fontWeight: "700",
    color: "#1f2937",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  placeholder: {
    width: 42,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: "#fffdf7",
    borderWidth: 1,
    borderColor: "#e5dcc8",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowSelected: {
    borderColor: "#111827",
    backgroundColor: "#f8f3e6",
  },
  rowSelectedAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#111827",
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 16,
  },
  rowMeta: {
    marginTop: 8,
    color: "#6b7280",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moveButtons: {
    gap: 6,
  },
  moveButton: {
    borderRadius: 999,
    backgroundColor: "#efe6d5",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabledButton: {
    opacity: 0.4,
  },
  moveLabel: {
    color: "#1f2937",
    fontWeight: "700",
  },
  deleteButton: {
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteLabel: {
    color: "#991b1b",
    fontWeight: "700",
  },
});
