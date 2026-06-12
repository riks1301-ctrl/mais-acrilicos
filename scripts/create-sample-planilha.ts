import * as XLSX from "xlsx";
import * as path from "path";

const wb = XLSX.utils.book_new();

const mainData: (string | number)[][] = [
  ["Controle Financeiro 2026", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["", "Jan/2026", "Fev/2026", "Mar/2026", "Abr/2026", "Mai/2026", "Jun/2026", "Jul/2026", "Ago/2026", "Set/2026", "Out/2026", "Nov/2026", "Dez/2026"],
  ["RECEITAS", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Salário", 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000],
  ["Freelance", 2000, 1500, 3000, 0, 2500, 2000, 1800, 2200, 1500, 3000, 2000, 2500],
  ["DESPESAS", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Moradia", 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500],
  ["Alimentação", 2000, 1800, 2100, 1950, 2200, 2000, 1900, 2100, 1850, 2000, 1950, 2200],
  ["Transporte", 800, 750, 900, 850, 800, 780, 820, 790, 810, 850, 800, 900],
  ["Cartão Crédito", 2500, 2200, 2800, 2400, 2600, 2300, 2500, 2700, 2200, 2900, 2400, 3100],
  ["Saúde", 500, 600, 450, 700, 500, 550, 480, 520, 600, 450, 500, 650],
  ["PATRIMÔNIO TOTAL", 250000, 255000, 262000, 268000, 275000, 282000, 290000, 298000, 305000, 312000, 320000, 330000],
  ["", "", "", "", "", "", "", "", "", "", "", "", ""],
];

for (let i = 0; i < 108; i++) mainData.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);

mainData.push(["INVESTIMENTOS", "", "", "", "", "", "", "", "", "", "", "", ""]);
const investments = [
  ["Caixa Emergência", "Nubank", 30000],
  ["Tesouro Selic", "BTG", 50000],
  ["CDB Banco Inter", "Inter", 25000],
  ["LCI Itaú", "Itaú", 40000],
  ["FII HGLG11", "XP", 35000],
  ["Ações PETR4", "Clear", 20000],
  ["ETF BOVA11", "Rico", 15000],
  ["Previdência PGBL", "Bradesco", 45000],
];

investments.forEach((row, i) => {
  const idx = 122 + i;
  while (mainData.length <= idx) mainData.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
  mainData[idx] = [...row, "", "", "", "", "", "", "", "", ""];
});

const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
XLSX.utils.book_append_sheet(wb, mainSheet, "Financeiro");

const consorcioData = [
  ["Administradora", "Grupo", "Cota", "Tipo", "Crédito", "Parcela", "Total Parc.", "Pagas", "Pago", "Lance Ofert.", "Lance Disp.", "Contemplado"],
  ["Rodobens", "1234", "056", "Imóvel", 350000, 2800, 180, 48, 134400, 70000, 200000, "Não"],
  ["Embracon", "5678", "012", "Auto", 120000, 950, 80, 24, 22800, 15000, 50000, "Não"],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(consorcioData), "Consórcios");

const cartoesData = [
  ["Nome", "Bandeira", "Limite"],
  ["Nubank Ultravioleta", "Mastercard", 25000],
  ["Itaú Personnalité", "Visa", 40000],
];
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cartoesData), "Cartões");

const outPath = path.join(process.cwd(), "planilha.xlsx");
XLSX.writeFile(wb, outPath);
console.log(`✅ Planilha de exemplo criada: ${outPath}`);
