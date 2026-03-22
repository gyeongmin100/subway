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
  favorites: Favorite[];
  onAddFavorite: (favorite: Favorite) => AddFavoriteResult;
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

function getFavoriteErrorMessage(reason: AddFavoriteFailureReason): string {
  if (reason === "duplicate") {
    return "\uC774\uBBF8 \uCD94\uAC00\uB41C \uC990\uACA8\uCC3E\uAE30\uC785\uB2C8\uB2E4.";
  }

  return "\uC990\uACA8\uCC3E\uAE30\uB294 \uCD5C\uB300 3\uAC1C\uAE4C\uC9C0 \uAC00\uB2A5\uD569\uB2C8\uB2E4.";
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
          <Text style={styles.title}>\uC5ED \uAC80\uC0C9</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={onOpenFavorites} style={styles.primaryButton}>
            <Text style={styles.primaryLabel}>\uC990\uACA8\uCC3E\uAE30</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="\uC5ED \uC774\uB984\uC744 \uAC80\uC0C9\uD558\uC138\uC694"
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
        <Text style={styles.sectionTitle}>\uD604\uC7AC \uC990\uACA8\uCC3E\uAE30</Text>
        {favorites.length === 0 ? (
          <Text style={styles.emptyText}>\uC990\uACA8\uCC3E\uAE30\uB97C \uCD94\uAC00\uD574\uBCF4\uC138\uC694</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favorites.map((favorite) => (
              <Pressable
                key={getFavoriteId(favorite)}
                onPress={() => onSelectCurrentFavorite(getFavoriteId(favorite))}
                style={styles.favoriteChip}
              >
                <Text style={styles.favoriteChipText}>
                  {makeDisplayLabel(
                    favorite.stationName,
                    favorite.lineName,
                    favorite.directionLabel,
                  )}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <Text style={styles.sectionTitle}>\uAC80\uC0C9 \uACB0\uACFC</Text>
      {query.trim().length < 2 ? (
        <Text style={styles.helperText}>
          2\uAE00\uC790 \uC774\uC0C1 \uC785\uB825\uD558\uBA74 \uAC80\uC0C9\uC774 \uC2DC\uC791\uB429\uB2C8\uB2E4.
        </Text>
      ) : results.length === 0 ? (
        <Text style={styles.helperText}>\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</Text>
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
                  "\uC990\uACA8\uCC3E\uAE30 \uCD94\uAC00",
                  `${displayLabel}\uC744 \uC990\uACA8\uCC3E\uAE30\uC5D0 \uCD94\uAC00\uD560\uAE4C\uC694?`,
                  [
                    { text: "\uCDE8\uC18C", style: "cancel" },
                    {
                      text: "\uCD94\uAC00",
                      onPress: () => {
                        const addResult = onAddFavorite(candidate);
                        if (!addResult.ok) {
                          Alert.alert(
                            "\uCD94\uAC00 \uC2E4\uD328",
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
