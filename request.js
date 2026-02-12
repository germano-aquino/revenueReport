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

const today = new Date();
const finalDateObj = new Date(today.getFullYear(), today.getMonth() + 1, 0);
const year = finalDateObj.getFullYear();
const month = String(finalDateObj.getMonth() + 1).padStart(2, "0");
const finalDay = String(finalDateObj.getDate()).padStart(2, "0");
const startDay = "01";
const finalDate = `${finalDay}/${month}/${year}`;
const startDate = `${startDay}/${month}/${year}`;

function stringToNumber(str) {
  return parseFloat(
    str.replace(/\s/g, "").replace(/\./g, "").replace(",", "."),
  );
}

function getHeadersForStore(store) {
  const idEstabelecimentoPattern = new RegExp(
    "(?<=TrinksAuth.+idEstabelecimentoPadrao)(.+?)=(.+?)(?=;)",
  );
  const cookie = headers.Cookie.replace(
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

  const responseBody = await response.json();
  const table = responseBody.Html;

  const totalPattern = /(?<=Total \(R\$\):<\/td>[\s\S]+[^>]>).+?(?=<)/;
  const totalValue = table.match(totalPattern);

  return stringToNumber(totalValue[0]);
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

  const responseBody = await response.json();
  const table = responseBody.Html;

  const cashPattern = /(?<=&#192; Vista<\/td>[\s\S]+[^>]>).+?(?=<)/;
  const cashValue = table.match(cashPattern);

  return stringToNumber(cashValue[0]);
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

  const responseBody = await response.json();
  const table = responseBody.Html;

  const valuesPattern = /(?<=<td class="alignRight">).+?(?=<)/g;
  const values = table.match(valuesPattern);

  return stringToNumber(values[0]) + stringToNumber(values[8]);
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

  const responseBody = await response.json();
  const table = responseBody.Html;

  const pattern = /(?<=<td class="alignRight">).+?(?=<)/g;
  const values = table.match(pattern);

  return stringToNumber(values[2]);
}

const request = {
  revenueFetch,
  revenueByTypeFetch,
  comissionFetch,
  productsIncomeFetch,
};

export default request;
