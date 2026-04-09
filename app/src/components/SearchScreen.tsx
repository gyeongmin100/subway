import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  AddFavoriteFailureReason,
  AddFavoriteResult,
} from "../lib/favorites";
import {
  favoriteFromSearchResult,
  getFavoriteId,
  makeDisplayLabel,
  searchStations,
} from "../lib/search";
import type { Favorite } from "../types/favorite";

type Props = {
  currentFavoriteId?: string | null;
  favorites: Favorite[];
  onAddFavorite: (favorite: Favorite) => AddFavoriteResult;
  onOpenFavorites: () => void;
  onSelectCurrentFavorite: (favoriteId: string) => void;
};

const LINE_COLORS: Record<string, string> = {
  "1호선": "#0052A4",
  "2호선": "#009D3E",
  "3호선": "#EF7C1C",
  "4호선": "#00A2D1",
  "5호선": "#8B50A4",
  "6호선": "#C55C1D",
  "7호선": "#54640D",
  "8호선": "#EA545D",
  "9호선": "#BDB092",
  "경의중앙선": "#77C4A3",
  "수인분당선": "#F5A200",
  "신분당선": "#D4003B",
  "공항철도": "#0090D2",
  "경춘선": "#0C8E72",
  "우이신설선": "#B0CE18",
  "서해선": "#8FC31F",
  "GTX-A": "#9B3B8C",
};

function getLineColor(lineName: string): string {
  return LINE_COLORS[lineName] ?? "#4b5563";
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function getFavoriteErrorMessage(reason: AddFavoriteFailureReason): string {
  if (reason === "duplicate") {
    return "이미 추가된 즐겨찾기입니다.";
  }

  return "즐겨찾기는 최대 5개까지 가능합니다.";
}

export function SearchScreen({
  currentFavoriteId,
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
        <Text style={styles.searchIcon}>🔍</Text>
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
            <Text style={styles.clearLabel}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.favoriteStrip}>
        <Text style={styles.sectionTitle}>현재 즐겨찾기</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>검색으로 즐겨찾기를 추가해보세요</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.map((favorite) => {
              const favId = getFavoriteId(favorite);
              const isSelected = favId === currentFavoriteId;
              return (
                <Pressable
                  key={favId}
                  onPress={() => onSelectCurrentFavorite(favId)}
                  style={[styles.favoriteChip, isSelected ? styles.favoriteChipSelected : null]}
                >
                  <Text style={[styles.favoriteChipText, isSelected ? styles.favoriteChipTextSelected : null]}>
                    {makeDisplayLabel(
                      favorite.stationName,
                      favorite.lineName,
                      favorite.directionLabel,
                    )}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Text style={styles.sectionTitle}>검색 결과</Text>
      {query.trim().length < 2 ? (
        <Text style={styles.helperText}>
          2글자 이상 입력하면 결과가 표시됩니다.
        </Text>
      ) : results.length === 0 ? (
        <Text style={styles.helperText}>일치하는 역을 찾을 수 없습니다.</Text>
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
                        const addResult = onAddFavorite(candidate);
                        if (!addResult.ok) {
                          Alert.alert(
                            "추가 실패",
                            getFavoriteErrorMessage(addResult.reason),
                          );
                        }
                      },
                    },
                  ],
                );
              }}
              style={styles.resultCard}
            >
              <View style={[styles.resultCardAccent, { backgroundColor: getLineColor(result.lineName) }]} />
              <View style={styles.resultCardContent}>
                <Text style={styles.stationName}>{result.stationName}</Text>
                <View style={styles.badgeRow}>
                  <Chip label={result.lineName} />
                  <Chip label={result.directionLabel} />
                </View>
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
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  favoriteChipSelected: {
    borderColor: "#111827",
    backgroundColor: "#fde68a",
  },
  favoriteChipText: {
    color: "#92400e",
    fontWeight: "700",
  },
  favoriteChipTextSelected: {
    color: "#111827",
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
    flexDirection: "row",
    overflow: "hidden",
  },
  resultCardAccent: {
    width: 5,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  resultCardContent: {
    flex: 1,
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
