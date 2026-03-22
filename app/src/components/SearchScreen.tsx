import * as React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  favoriteFromSearchResult,
  getFavoriteId,
  makeDisplayLabel,
  searchStations,
} from "../lib/search";
import type { Favorite } from "../types/favorite";

type Props = {
  favorites: Favorite[];
  onAddFavorite: (favorite: Favorite) => boolean;
  onOpenFavorites: () => void;
  onSelectCurrentFavorite: (favoriteId: string) => void;
};

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function SearchScreen({
  favorites,
  onAddFavorite,
  onOpenFavorites,
  onSelectCurrentFavorite,
}: Props) {
  const [query, setQuery] = React.useState("");
  const results = searchStations(query);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SEARCH</Text>
          <Text style={styles.title}>역 검색</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={onOpenFavorites} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>즐겨찾기</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="역 이름을 검색하세요"
          placeholderTextColor="#7a7a7a"
          style={styles.input}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} style={styles.clearButton}>
            <Text style={styles.clearLabel}>X</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.favoriteStrip}>
        <Text style={styles.sectionTitle}>현재 즐겨찾기</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>즐겨찾기를 추가해보세요</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.map((favorite) => (
              <Pressable
                key={getFavoriteId(favorite)}
                onPress={() => onSelectCurrentFavorite(getFavoriteId(favorite))}
                style={styles.favoriteChip}
              >
                <Text style={styles.favoriteChipText}>
                  {makeDisplayLabel(favorite.stationName, favorite.lineName, favorite.directionLabel)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <Text style={styles.sectionTitle}>검색 결과</Text>
      {query.trim().length < 2 ? (
        <Text style={styles.helperText}>2글자 이상 입력하면 검색이 시작됩니다.</Text>
      ) : results.length === 0 ? (
        <Text style={styles.helperText}>검색 결과가 없습니다</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.resultList}>
          {results.map((result) => (
            <Pressable
              key={getFavoriteId(result)}
              onPress={() => {
                const candidate = favoriteFromSearchResult(result);
                const displayLabel = makeDisplayLabel(
                  result.stationName,
                  result.lineName,
                  result.directionLabel,
                );
                Alert.alert(
                  "즐겨찾기 추가",
                  `${displayLabel}을 즐겨찾기에 추가할까요?`,
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "추가",
                      onPress: () => {
                        const added = onAddFavorite(candidate);
                        if (!added) {
                          Alert.alert(
                            "추가 실패",
                            favorites.some((item) => getFavoriteId(item) === getFavoriteId(candidate))
                              ? "이미 추가한 즐겨찾기입니다"
                              : "즐겨찾기는 최대 3개까지 가능합니다",
                          );
                        }
                      },
                    },
                  ],
                );
              }}
              style={styles.resultCard}
            >
              <Text style={styles.stationName}>{result.stationName}</Text>
              <View style={styles.badgeRow}>
                <Chip label={result.lineName} />
                <Chip label={result.directionLabel} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efe8d8",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    color: "#6b7280",
    letterSpacing: 2,
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  searchBox: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf6",
    borderWidth: 1,
    borderColor: "#d9ccb3",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#111827",
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ece3d0",
  },
  clearLabel: {
    fontWeight: "700",
    color: "#4b5563",
  },
  favoriteStrip: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  favoriteChip: {
    marginRight: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fef3c7",
  },
  favoriteChipText: {
    color: "#92400e",
    fontWeight: "700",
  },
  helperText: {
    color: "#6b7280",
    fontSize: 14,
  },
  resultList: {
    paddingBottom: 24,
    gap: 12,
  },
  resultCard: {
    borderRadius: 24,
    backgroundColor: "#fffdf6",
    borderWidth: 1,
    borderColor: "#d9ccb3",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  stationName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
