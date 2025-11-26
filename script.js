// Simple BTC/INR comparison script

const sources = [
  {
    name: "CoinDCX",
    url: "https://api.coindcx.com/exchange/ticker",
    parse: (arr) => {
      const item = arr.find((i) => i.market === "BTCINR");
      return item ? parseFloat(item.ask) : null;
    }
  },
  {
    name: "ZebPay",
    url: "https://www.zebapi.com/api/v1/market/BTC-INR/ticker",
    parse: (data) => parseFloat(data.market)
  },
  {
    name: "Unocoin",
    url: "https://api.unocoin.com/api/v1/exchange/tickers",
    parse: (arr) => {
      const item = arr.find((i) => i.ticker_id === "BTC_INR");
      return item ? parseFloat(item.last_price) : null;
    }
  },
  {
    name: "CoinGecko",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr",
    parse: (data) => parseFloat(data.bitcoin.inr)
  }
];

const tableBody = document.querySelector("#priceTable tbody");
const updatedAtEl = document.getElementById("updatedAt");

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function refresh() {
  const results = await Promise.allSettled(
    sources.map((s) => fetchJSON(s.url).then((data) => ({ source: s, value: s.parse(data) })))
  );

  const refObj = results.find((r) => r.status === "fulfilled" && r.value.source.name === "CoinGecko");
  const refPrice = refObj && refObj.value.value;

  tableBody.innerHTML = "";

  const avgSources = ["Unocoin", "ZebPay", "CoinDCX"];
  const avgPrices = [];

  results.forEach((res) => {
    if (res.status !== "fulfilled") return; // skip failed fetches
    const { source, value } = res.value;
    if (value == null || isNaN(value)) return;

    if (avgSources.includes(source.name)) {
      avgPrices.push(value);
    }

    const diff = refPrice ? ((value - refPrice) / refPrice) * 100 : null;

    const tr = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.textContent = source.name;
    tr.appendChild(nameTd);

    const priceTd = document.createElement("td");
    priceTd.textContent = value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    tr.appendChild(priceTd);

    const diffTd = document.createElement("td");
    if (diff == null) {
      diffTd.textContent = "-";
    } else {
      diffTd.textContent = diff.toFixed(2) + "%";
      diffTd.className = diff >= 0 ? "good" : "bad";
    }
    tr.appendChild(diffTd);

    tableBody.appendChild(tr);
  });

  if (avgPrices.length > 0) {
    const avgPrice = avgPrices.reduce((a, b) => a + b, 0) / avgPrices.length;
    const avgDiff = refPrice ? ((avgPrice - refPrice) / refPrice) * 100 : null;

    const tr = document.createElement("tr");
    tr.className = "average-row";

    const nameTd = document.createElement("td");
    nameTd.textContent = "Average of Indian exchanges";
    tr.appendChild(nameTd);

    const priceTd = document.createElement("td");
    priceTd.textContent = avgPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    tr.appendChild(priceTd);

    const diffTd = document.createElement("td");
    if (avgDiff == null) {
      diffTd.textContent = "-";
    } else {
      diffTd.textContent = avgDiff.toFixed(2) + "%";
      diffTd.className = avgDiff >= 0 ? "good" : "bad";
    }
    tr.appendChild(diffTd);

    tableBody.appendChild(tr);
  }

  updatedAtEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

refresh();
setInterval(refresh, 30000); // update every 30 seconds 
