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
import { Ionicons } from "@expo/vector-icons";

import type {
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
  query: string;
  onAddFavorite: (favorite: Favorite) => AddFavoriteResult;
  onChangeQuery: (query: string) => void;
  onDelete: (favoriteId: string) => void;
  onMove: (favoriteId: string, direction: -1 | 1) => void;
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
  "에버라인": "#B0CE18",
  "서해선": "#8FC31F",
  "GTX-A": "#9B3B8C",
};

function getLineColor(lineName: string): string {
  return LINE_COLORS[lineName] ?? "#4b5563";
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text numberOfLines={1} style={styles.chipText}>{label}</Text>
    </View>
  );
}

function getFavoriteErrorMessage(): string {
  return "이미 추가된 즐겨찾기입니다.";
}

function StationCardBody({
  directionLabel,
  lineName,
  stationName,
}: {
  directionLabel: string;
  lineName: string;
  stationName: string;
}) {
  return (
    <>
      <View style={[styles.resultCardAccent, { backgroundColor: getLineColor(lineName) }]} />
      <View style={styles.resultCardContent}>
        <Text numberOfLines={1} style={styles.stationName}>
          {stationName}
        </Text>
        <View style={styles.badgeRow}>
          <Chip label={lineName} />
          <Chip label={directionLabel} />
        </View>
      </View>
    </>
  );
}

export function SearchScreen({
  currentFavoriteId,
  favorites,
  query,
  onAddFavorite,
  onChangeQuery,
  onDelete,
  onMove,
  onSelectCurrentFavorite,
}: Props) {
  const isSearching = query.trim().length >= 2;
  const results = searchStations(query);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>역 검색</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#5a8a8a" />
        <TextInput
          autoCapitalize="none"
          onChangeText={onChangeQuery}
          placeholder="역 이름을 검색하세요"
          placeholderTextColor="#7a7a7a"
          style={styles.input}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => onChangeQuery("")} style={styles.clearButton}>
            <Ionicons name="close" size={16} color="#5a8a8a" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {isSearching ? "검색 결과" : "현재 즐겨찾기"}
        </Text>

        {!isSearching ? (
          <View style={styles.favoriteArea}>
            {favorites.length === 0 ? (
              <Text style={styles.emptyText}>검색으로 즐겨찾기를 추가해보세요</Text>
            ) : (
              <ScrollView contentContainerStyle={styles.favoriteList}>
                {favorites.map((favorite, index) => {
                  const favoriteId = getFavoriteId(favorite);
                  const isSelected = favoriteId === currentFavoriteId;

                  return (
                    <View
                      key={favoriteId}
                      style={[
                        styles.favoriteCard,
                        isSelected ? styles.favoriteCardSelected : null,
                      ]}
                    >
                      <Pressable
                        onPress={() => onSelectCurrentFavorite(favoriteId)}
                        style={styles.favoriteCardBody}
                      >
                        <StationCardBody
                          directionLabel={favorite.directionLabel}
                          lineName={favorite.lineName}
                          stationName={favorite.stationName}
                        />
                      </Pressable>

                      <View style={styles.favoriteActions}>
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
        ) : (
          <View style={styles.resultArea}>
            {results.length === 0 ? (
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
                                  getFavoriteErrorMessage(),
                                );
                              }
                            },
                          },
                        ],
                      );
                    }}
                    style={styles.resultCard}
                  >
                    <StationCardBody
                      directionLabel={result.directionLabel}
                      lineName={result.lineName}
                      stationName={result.stationName}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>도착 정보는 실제와 다를 수 있습니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0fafa",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "700",
    color: "#1a3a3a",
  },
  searchBox: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#b2e0e0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#1a3a3a",
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d0f0f0",
  },
  content: {
    flex: 1,
    marginTop: 22,
    minHeight: 0,
  },
  favoriteArea: {
    flex: 1,
    minHeight: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a3a3a",
    marginBottom: 10,
  },
  emptyText: {
    color: "#5a8a8a",
    fontSize: 14,
  },
  favoriteList: {
    gap: 12,
    paddingBottom: 24,
  },
  favoriteCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#b2e0e0",
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#5bc8c8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  favoriteCardSelected: {
    borderColor: "#2d7a7a",
    backgroundColor: "#e6f7f7",
  },
  favoriteCardBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
  },
  favoriteActions: {
    width: 92,
    flexShrink: 0,
    borderLeftWidth: 1,
    borderLeftColor: "#d0f0f0",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  moveButtons: {
    flexDirection: "row",
    gap: 6,
  },
  moveButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d0f0f0",
  },
  disabledButton: {
    opacity: 0.4,
  },
  deleteButton: {
    borderRadius: 999,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  deleteLabel: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 13,
  },
  helperText: {
    color: "#5a8a8a",
    fontSize: 14,
  },
  resultArea: {
    flex: 1,
    minHeight: 0,
  },
  resultList: {
    paddingBottom: 24,
    gap: 12,
  },
  resultCard: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#b2e0e0",
    flexDirection: "row",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#5bc8c8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  resultCardAccent: {
    width: 5,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
  },
  resultCardContent: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  stationName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a3a3a",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: "#2d7a7a",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  disclaimer: {
    alignSelf: "center",
    backgroundColor: "#e6f7f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
