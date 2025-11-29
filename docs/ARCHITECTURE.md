# Architecure
General architecture of this project.

# API
Using an unsupported NBA API via [nba_api](https://github.com/swar/nba_api)

## Headers
We need the following headers when making requests
```text
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.9
Referer: https://www.nba.com/
Origin: https://www.nba.com
Connection: keep-alive
Host: stats.nba.com
```

## [PlayerIndex](https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/playerindex.md)
Retrieves all players

### Example Request & Response
Request: 
https://stats.nba.com/stats/playerindex?LeagueId=00&Season=2025-26

Response: Example Response for the current season for NBA
```json
{
  "resource": "playerindex",
  "parameters": {
    "LeagueID": "00",
    "Season": "2025-26",
    "Historical": 0,
    "TeamID": 0,
    "Country": null,
    "College": null,
    "DraftYear": null,
    "DraftPick": null,
    "PlayerPosition": "",
    "Height": null,
    "Weight": null,
    "Active": 0,
    "AllStar": 0
  },
  "resultSets": [
    {
      "name": "PlayerIndex",
      "headers": [
        "PERSON_ID",
        "PLAYER_LAST_NAME",
        "PLAYER_FIRST_NAME",
        "PLAYER_SLUG",
        "TEAM_ID",
        "TEAM_SLUG",
        "IS_DEFUNCT",
        "TEAM_CITY",
        "TEAM_NAME",
        "TEAM_ABBREVIATION",
        "JERSEY_NUMBER",
        "POSITION",
        "HEIGHT",
        "WEIGHT",
        "COLLEGE",
        "COUNTRY",
        "DRAFT_YEAR",
        "DRAFT_ROUND",
        "DRAFT_NUMBER",
        "ROSTER_STATUS",
        "FROM_YEAR",
        "TO_YEAR",
        "PTS",
        "REB",
        "AST",
        "STATS_TIMEFRAME"
      ],
      "rowSet": [
        [
          1630173,
          "Achiuwa",
          "Precious",
          "precious-achiuwa",
          1610612758,
          "kings",
          0,
          "Sacramento",
          "Kings",
          "SAC",
          "9",
          "F",
          "6-8",
          "243",
          "Memphis",
          "Nigeria",
          2020,
          1,
          20,
          1.0,
          "2020",
          "2025",
          7.4,
          5.0,
          1.1,
          "Season"
        ],
        ...
        ...
      ]
    }
  ]
}
```

## [PlayerGameLog](https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/playergamelog.md)
Retrieves the given players game logs and stats 

### Example Request and Response
Request: Example Request to Retrieve game logs for Victor Wembanyama with `PlayerId` 1641705
https://stats.nba.com/stats/playergamelog?Season=2025-26&PlayerId=1641705&SeasonType=Regular Season

Response: It looks like it returns the most recent data in the `resultSets`.
```json
{
  "resource": "playergamelog",
  "parameters": {
    "PlayerID": 1641705,
    "LeagueID": "00",
    "Season": "2025-26",
    "SeasonType": "Regular Season",
    "DateFrom": null,
    "DateTo": null
  },
  "resultSets": [
    {
      "name": "PlayerGameLog",
      "headers": [
        "SEASON_ID",
        "Player_ID",
        "Game_ID",
        "GAME_DATE",
        "MATCHUP",
        "WL",
        "MIN",
        "FGM",
        "FGA",
        "FG_PCT",
        "FG3M",
        "FG3A",
        "FG3_PCT",
        "FTM",
        "FTA",
        "FT_PCT",
        "OREB",
        "DREB",
        "REB",
        "AST",
        "STL",
        "BLK",
        "TOV",
        "PF",
        "PTS",
        "PLUS_MINUS",
        "VIDEO_AVAILABLE"
      ],
      "rowSet": [
        [
          "22025",
          1641705,
          "0022500047",
          "Nov 14, 2025",
          "SAS vs. GSW",
          "L",
          38,
          10,
          21,
          0.476,
          3,
          8,
          0.375,
          3,
          3,
          1.0,
          3,
          9,
          12,
          4,
          1,
          3,
          3,
          1,
          26,
          6,
          1
        ],
        ...
        ...
      ]
    }
  ]
}
```

# Stats to optimise
- Field Goal Percentage (FG%)
- Free Throw Percentage (FT%)
- 3-point Shots Made (3PTM)
- Points Scored (PTS)
- Total Rebounds (REB)
- Assists (AST)
- Steals (ST)
- Blocked Shots (BLK)
- Turnovers (TO)

# Intermediate Goals
Imagine i have steven adams in my team
And i wanna beat ashwin this week
I wanna know if i pick up someone else
Will it be better for my win chances or worse

## App stack (web)
- Next.js App Router with React Server Components for data reads.
- SQLite + Drizzle ORM for structured storage of player metadata and logs.
- Zod for validating inbound data from `nba_api` before it touches the database.
- Drizzle Kit for schema management and the local studio.
- SQLite file lives at `./skill-issue-app/sqlite/db.sql`; configure via `DB_PATH` in `.env`.


