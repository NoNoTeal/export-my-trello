# Export My Trello Board!

Edit `editme.json`

```json
//SYNTAX
["board ID", "end result"]
```

## NPM Runs

**npm run getCSV** Look in `input` folder for Trello JSONs, and converts to a CSV file. Finished product ends up in the `output` folder
**npm run getJSON** Look in `editme.json` for Trello Boards to rip, and converts to a JSON file, and finished product ends up in the `input` folder. Also grabs EVERY ACTION, (I know about the 1000 action limit, and got past that for you!)
**npm run runAll** Runs getJSON then getCSV.

## Misc.

For large boards, it may take a while.
JSON File (520~ MB) -> CSV File (30~ MB), so for every 17 MB of a JSON file, it's shrinked down to 1 MB for a CSV file.
