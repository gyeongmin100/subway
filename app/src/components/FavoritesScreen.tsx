import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
          <Ionicons name="subway-outline" size={48} color="#5bc8c8" />
          <Text style={styles.emptyTitle}>즐겨찾기가 없습니다</Text>
          <Text style={styles.emptyText}>검색 화면에서 즐겨찾기를 추가할 수 있습니다.</Text>
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
                      <Ionicons name="chevron-up" size={16} color="#1a3a3a" />
                    </Pressable>
                    <Pressable
                      disabled={index === favorites.length - 1}
                      onPress={() => onMove(favoriteId, 1)}
                      style={[
                        styles.moveButton,
                        index === favorites.length - 1 ? styles.disabledButton : null,
                      ]}
                    >
                      <Ionicons name="chevron-down" size={16} color="#1a3a3a" />
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
    backgroundColor: "#f0fafa",
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
    backgroundColor: "#d0f0f0",
  },
  backLabel: {
    fontWeight: "700",
    color: "#1a3a3a",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a3a3a",
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
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a3a3a",
  },
  emptyText: {
    textAlign: "center",
    color: "#5a8a8a",
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    marginBottom: 12,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#b2e0e0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    elevation: 3,
    shadowColor: "#5bc8c8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  rowSelected: {
    borderColor: "#2d7a7a",
    backgroundColor: "#e6f7f7",
  },
  rowSelectedAccent: {
    borderLeftWidth: 3,
    borderLeftColor: "#2d7a7a",
    paddingLeft: 13,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontWeight: "700",
    color: "#1a3a3a",
    fontSize: 16,
  },
  rowMeta: {
    marginTop: 8,
    color: "#5a8a8a",
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
    backgroundColor: "#d0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabledButton: {
    opacity: 0.4,
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
