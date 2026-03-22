from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OFFICIAL_CSV_PATH = ROOT / "실시간도착_역정보(20260108).csv"
def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    official_rows = read_csv_rows(OFFICIAL_CSV_PATH)
    if not official_rows:
        raise RuntimeError("Official CSV is empty.")

    official_columns = list(official_rows[0].keys())
    _, _, station_name_column, line_name_column = official_columns

    official_station_names = {
        row[station_name_column].strip()
        for row in official_rows
    }

    station_master_rows: list[dict[str, object]] = []
    seen_pairs: set[tuple[str, str]] = set()
    for row in official_rows:
        station_name = row[station_name_column].strip()
        line_name = row[line_name_column].strip()
        pair = (station_name, line_name)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        station_master_rows.append(
            {
                "stationName": station_name,
                "lineName": line_name,
            }
        )

    app_data_dir = ROOT / "app" / "src" / "data"

    (app_data_dir / "stationMaster.json").write_text(
        json.dumps(station_master_rows, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "officialStationCount": len(official_station_names),
                "stationMasterRowCount": len(station_master_rows),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
