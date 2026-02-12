import request from "./request.js";
import fs from "fs";
import { json2csv } from "json-2-csv";

const report = [
  {
    loja: "14",
    valoresRecebidos: 0,
    comissaoMei: 0,
    produtos: 0,
  },
  {
    loja: "batista",
    valoresRecebidos: 0,
    comissaoMei: 0,
    produtos: 0,
  },
  {
    loja: "duque",
    valoresRecebidos: 0,
    comissaoMei: 0,
    produtos: 0,
  },
  {
    loja: "umarizal",
    valoresRecebidos: 0,
    comissaoMei: 0,
    produtos: 0,
  },
];

await main();

async function main() {
  console.log("Relatório de Final do mês:\n\n");

  for (const unit of report) {
    console.log("Gerando valores para loja %s.", unit.loja);
    unit.valoresRecebidos = await getRevenue(unit.loja);
    unit.comissaoMei = await getComission(unit.loja);
    unit.produtos = await getProductsIncome(unit.loja);
  }

  const jsonString = JSON.stringify(report, null, 2);
  fs.writeFileSync("data.json", jsonString, "utf-8");
  const csvFile = json2csv(report, { emptyFieldValue: 0 });
  fs.writeFileSync("relatorio.csv", csvFile, "utf-8");
}

async function getRevenue(store) {
  const totalValue = await request.revenueFetch(store);
  const cashValue = await request.revenueByTypeFetch(store);
  return totalValue - cashValue;
}

async function getComission(store) {
  const comission = await request.comissionFetch(store);
  return comission;
}

async function getProductsIncome(store) {
  const income = await request.productsIncomeFetch(store);
  return income;
}
