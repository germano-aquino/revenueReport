import headers from "./headers.js";

const revenueUrl =
  "https://www.trinks.com/BackOffice/Relatorios/ResultadoRelatorioFinanceiroPorFormaPagamento";

const revenueByTypeUrl =
  "https://www.trinks.com/Backoffice/Relatorios/ExibirLancamentosAgrupadosPorTipoFormaPagamento";

const comissionUrl =
  "https://www.trinks.com/BackOffice/Comissao/ResultadoRelatorioComissoes";

const productsUrl = "https://www.trinks.com/BackOffice/Venda/Filtrar";

const lojaIds = {
  14: {
    idRelacaoProfissional: "46810",
    idEstabelecimento: "18769",
  },
  batista: {
    idRelacaoProfissional: "103890",
    idEstabelecimento: "35295",
  },
  duque: {
    idRelacaoProfissional: "440885",
    idEstabelecimento: "120037",
  },
  umarizal: {
    idRelacaoProfissional: "49102",
    idEstabelecimento: "19357",
  },
};

let cookie = headers.Cookie;

const currentDate = new Date();
let year = currentDate.getFullYear();
let month = String(currentDate.getMonth() + 1).padStart(2, "0");
const finalDay = String(currentDate.getDate() - 1).padStart(2, "0");
const startDay = "01";
let startDate = `${startDay}/${month}/${year}`;
let finalDate = `${finalDay}/${month}/${year}`;

function stringToNumber(str) {
  return parseFloat(
    str.replace(/\s/g, "").replace(/\./g, "").replace(",", "."),
  );
}

function getHeadersForStore(store) {
  const idEstabelecimentoPattern = new RegExp(
    "(?<=TrinksAuth.+idEstabelecimentoPadrao)(.+?)=(.+?)(?=;)",
  );
  cookie = cookie.replace(
    idEstabelecimentoPattern,
    `$1=${lojaIds[store].idEstabelecimento}`,
  );

  return {
    ...headers,
    "id-estabelecimento-autenticado": lojaIds[store].idEstabelecimento,
    Cookie: cookie,
  };
}

async function revenueFetch(store) {
  const revenueBody = {
    TemPermissaoParaFiltroCompleto: true,
    TipoData: 2,
    DataInicio: startDate,
    DataFim: finalDate,
    IdFormaPagamentoOuTipo: 0,
    ExibirEstornos: false,
    ExibirCreditoClienteExportacao: [true, false],
    IdContaFinanceiraSelecionada: 0,
  };

  const body = new URLSearchParams(revenueBody);

  const response = await fetch(revenueUrl, {
    method: "POST",
    headers: getHeadersForStore(store),
    body,
  });

  setCookie(response);

  const responseBody = await response.json();
  const table = responseBody.Html;

  const totalPattern = /(?<=Total \(R\$\):<\/td>[\s\S]+[^>]>).+?(?=<)/;
  const totalValue = table.match(totalPattern);

  return totalValue?.length > 0 ? stringToNumber(totalValue[0]) : 0;
}

async function revenueByTypeFetch(store) {
  const requestBody = {
    TemPermissaoParaFiltroCompleto: true,
    TipoData: 2,
    DataInicio: startDate,
    DataFim: finalDate,
    IdFormaPagamentoOuTipo: 0,
    ExibirEstornos: false,
    ExibirCreditoClienteExportacao: [true, false],
    IdContaFinanceiraSelecionada: 0,
    mes: month,
    ano: year,
    indexLinha: 0,
  };

  const body = new URLSearchParams(requestBody);

  const response = await fetch(revenueByTypeUrl, {
    method: "POST",
    headers: getHeadersForStore(store),
    body,
  });

  setCookie(response);

  const responseBody = await response.json();
  const table = responseBody.Html;

  const cashPattern = /(?<=&#192; Vista<\/td>[\s\S]+[^>]>).+?(?=<)/;
  const cashValue = table.match(cashPattern);

  return cashValue?.length > 0 ? stringToNumber(cashValue[0]) : 0;
}

async function comissionFetch(store) {
  const requestBody = {
    TipoData: 2,
    DataInicio: startDate,
    DataFim: finalDate,
    TipoItemPago: 0,
    ExibirEstornos: false,
    TipoStatusFiltroPagamento: 1,
    IdRelacaoProfissional: lojaIds[store].idRelacaoProfissional,
    temPagamentoProfissional: true,
  };

  const body = new URLSearchParams(requestBody);

  const response = await fetch(comissionUrl, {
    method: "POST",
    headers: getHeadersForStore(store),
    body,
  });

  setCookie(response);

  const responseBody = await response.json();
  const table = responseBody.Html;

  const valuesPattern = /(?<=<td class="alignRight">).+?(?=<)/g;
  const values = table.match(valuesPattern);

  return values?.length > 8
    ? stringToNumber(values[0]) + stringToNumber(values[8])
    : 0;
}

async function productsIncomeFetch(store) {
  const requestBody = {
    "Filtro.DataInicio": startDate,
    "Filtro.DataFim": finalDate,
    "Filtro.ExibirEstornos": false,
    "Filtro.TextoBuscaCliente": "",
    "Filtro.IdPessoaProfissionalComprador": 0,
    "Filtro.TipoComprador": 0,
    "Filtro.IdEstabelecimentoFabricante": 0,
    "Filtro.IdPessoaProfissional": 0,
    "Filtro.IdEstabelecimentoProduto": 0,
    "Filtro.IdCategoria": 0,
    "Filtro.ApenasVendasAvulsas": false,
    "Filtro.ApenasVendasComDescontoProfissionais": false,
    "Filtro.IdStatusNovaFiscal": 2,
    "Filtro.NumeroNfc": "",
  };

  const body = new URLSearchParams(requestBody);

  const response = await fetch(productsUrl, {
    method: "POST",
    headers: getHeadersForStore(store),
    body,
  });

  setCookie(response);

  const responseBody = await response.json();
  const table = responseBody.Html;

  const pattern = /(?<=<td class="alignRight">).+?(?=<)/g;
  const values = table.match(pattern);

  return values?.length > 2 ? stringToNumber(values[2]) : 0;
}

function setCookie(response) {
  const setCookie = response.headers.getSetCookie();
  if (setCookie) {
    setCookie.map((ck) => {
      const keyValue = ck.split(";")[0];
      const [key, value] = keyValue.split("=");
      const pattern = new RegExp(`(?<=${key})=(.+?)(?=;)`);
      cookie = cookie.replace(pattern, `=${value}`);
    });
  }
}

function setStartDate(newStartDate) {
  startDate = newStartDate;
}

function setFinalDate(newFinalDate) {
  finalDate = newFinalDate;
}

function getStartDate() {
  return startDate;
}

function getFinalDate() {
  return finalDate;
}

function setMonthAndYear(newMonth, newYear) {
  month = newMonth;
  year = newYear;
}

const request = {
  revenueFetch,
  revenueByTypeFetch,
  comissionFetch,
  productsIncomeFetch,
  setStartDate,
  getStartDate,
  setFinalDate,
  getFinalDate,
  setMonthAndYear,
};

export default request;
