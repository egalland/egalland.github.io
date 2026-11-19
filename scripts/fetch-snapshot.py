"""Download dated public market data for explicitly labelled offline fallback."""
import concurrent.futures
import datetime
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://data-api.binance.vision/api/v3/"
SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]
INTERVALS = ["15m", "1h", "4h", "1d"]

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=25) as response:
        return json.load(response)

def market(pair):
    symbol, interval = pair
    rows = get(f"klines?symbol={symbol}&interval={interval}&limit=500")
    if not isinstance(rows, list) or len(rows) < 64:
        raise ValueError(f"Invalid public data for {symbol}/{interval}")
    return symbol, interval, rows

def main():
    snapshot = {"fetchedAt": int(time.time()*1000), "source": BASE, "markets": {}, "quotes": {}}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for symbol, interval, rows in executor.map(market, [(s,i) for s in SYMBOLS for i in INTERVALS]):
            snapshot["markets"].setdefault(symbol,{})[interval] = rows
    quotes = get("ticker/24hr?symbols=" + urllib.parse.quote(json.dumps(SYMBOLS,separators=(",", ":"))))
    snapshot["quotes"] = {q["symbol"]:q for q in quotes}
    path = Path(__file__).resolve().parents[1] / "dist" / "snapshot.json"
    path.write_text(json.dumps(snapshot,separators=(",", ":")),encoding="utf-8")
    print(json.dumps({"path":str(path),"markets":16,"candles":sum(len(rows) for v in snapshot["markets"].values() for rows in v.values()),"quotes":len(quotes),"timestamp":datetime.datetime.fromtimestamp(snapshot["fetchedAt"]/1000,datetime.timezone.utc).isoformat()}))

if __name__ == "__main__":
    main()
