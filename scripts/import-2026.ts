import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const YEAR = 2026;
const PLANILHA = path.join(process.cwd(), "planilha.xlsx");

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MONTH_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const s = String(val)
    .replace(/R\$\s?/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function cellRef(row: number, col: number): string {
  let c = col;
  let label = "";
  while (c >= 0) {
    label = String.fromCharCode((c % 26) + 65) + label;
    c = Math.floor(c / 26) - 1;
  }
  return `${label}${row + 1}`;
}

function getCell(sheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const ref = cellRef(row, col);
  const cell = sheet[ref];
  return cell ? cell.v : undefined;
}

function normalizeMonth(text: string): number | null {
  const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const name = MONTH_NAMES[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes(name) || t.includes(MONTH_ABBR[i % 12])) return (i % 12) + 1;
  }
  if (/\b(1[0-2]|[1-9])\b/.test(t)) {
    const m = parseInt(t.match(/\b(1[0-2]|[1-9])\b/)![1], 10);
    if (m >= 1 && m <= 12) return m;
  }
  return null;
}

function detectInvestmentType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("tesouro") || n.includes("selic") || n.includes("ipca")) return "tesouro";
  if (n.includes("cdb")) return "CDB";
  if (n.includes("lci")) return "LCI";
  if (n.includes("lca")) return "LCA";
  if (n.includes("fii") || n.includes("fundo imob")) return "FII";
  if (n.includes("etf")) return "ETF";
  if (n.includes("ação") || n.includes("acao") || n.includes("ações")) return "ações";
  if (n.includes("cripto") || n.includes("bitcoin") || n.includes("btc")) return "cripto";
  if (n.includes("fgts")) return "FGTS";
  if (n.includes("previd")) return "previdência";
  if (n.includes("imóvel") || n.includes("imovel")) return "imóvel";
  if (n.includes("caixa") || n.includes("poupança") || n.includes("poupanca") || n.includes("saldo")) return "caixa";
  return "outros";
}

interface ImportStats {
  transactions: number;
  investments: number;
  consortiums: number;
  cards: number;
  patrimony: number;
}

async function clear2026Data() {
  await prisma.transaction.deleteMany({ where: { year: YEAR } });
  await prisma.investment.deleteMany({ where: { year: YEAR } });
  await prisma.patrimonySnapshot.deleteMany({ where: { year: YEAR } });
}

function findMonthColumns(sheet: XLSX.WorkSheet, range: XLSX.Range): Map<number, number> {
  const monthCols = new Map<number, number>();
  for (let r = 0; r <= Math.min(range.e.r, 15); r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const val = getCell(sheet, r, c);
      if (!val) continue;
      const str = String(val);
      if (!str.includes("2026") && !MONTH_NAMES.some((m) => str.toLowerCase().includes(m.slice(0, 3)))) continue;
      const month = normalizeMonth(str);
      if (month) monthCols.set(month, c);
    }
  }
  if (monthCols.size === 0) {
    for (let m = 1; m <= 12; m++) {
      monthCols.set(m, m);
    }
  }
  return monthCols;
}

async function importFromSheet(sheet: XLSX.WorkSheet, sheetName: string, stats: ImportStats) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z200");
  const monthCols = findMonthColumns(sheet, range);
  const rows: XLSX.WorkSheet = sheet;

  for (let r = 0; r <= range.e.r; r++) {
    const labelA = String(getCell(rows, r, 0) || "").toLowerCase().trim();
    const labelB = String(getCell(rows, r, 1) || "").toLowerCase().trim();
    const label = labelA || labelB;
    if (!label) continue;

    const isIncome =
      label.includes("receita") ||
      label.includes("salário") ||
      label.includes("salario") ||
      label.includes("renda") ||
      label.includes("entrada");
    const isExpense =
      label.includes("despesa") ||
      label.includes("gasto") ||
      label.includes("saída") ||
      label.includes("saida") ||
      label.includes("pagamento");
    const isCard = label.includes("cartão") || label.includes("cartao") || label.includes("fatura");
    const isPatrimony = label.includes("patrimônio") || label.includes("patrimonio") || label.includes("total geral");
    const isProjection = label.includes("projeção") || label.includes("projecao") || label.includes("previsto");

    if (isIncome || isExpense) {
      const category = String(getCell(rows, r, 1) || getCell(rows, r, 0) || "Geral").trim();
      const description = category;

      for (const [month, col] of monthCols) {
        const amount = parseNum(getCell(rows, r, col));
        if (amount === 0) continue;
        await prisma.transaction.create({
          data: {
            date: new Date(YEAR, month - 1, 1),
            description,
            category,
            amount: Math.abs(amount),
            type: isIncome ? "receita" : "despesa",
            paymentMethod: isCard ? "cartão" : "outros",
            month,
            year: YEAR,
            isProjection: isProjection,
          },
        });
        stats.transactions++;
      }
    }

    if (isPatrimony) {
      for (const [month, col] of monthCols) {
        const value = parseNum(getCell(rows, r, col));
        if (value === 0) continue;
        await prisma.patrimonySnapshot.upsert({
          where: { year_month: { year: YEAR, month } },
          create: { year: YEAR, month, totalValue: value },
          update: { totalValue: value },
        });
        stats.patrimony++;
      }
    }
  }

  // Category rows: description in A, values per month in columns
  for (let r = 0; r <= range.e.r; r++) {
    const desc = String(getCell(rows, r, 0) || "").trim();
    if (!desc || desc.length < 2) continue;
    const lower = desc.toLowerCase();
    if (
      lower.includes("total") ||
      lower.includes("subtotal") ||
      lower.includes("patrimônio") ||
      lower.includes("investimento") ||
      lower.includes("consórcio") ||
      lower.includes("consorcio")
    )
      continue;

    let hasValues = false;
    for (const [, col] of monthCols) {
      if (parseNum(getCell(rows, r, col)) !== 0) hasValues = true;
    }
    if (!hasValues) continue;

    const parentLower = String(getCell(rows, r - 1, 0) || "").toLowerCase();
    let type: "receita" | "despesa" | null = null;
    if (parentLower.includes("receita") || parentLower.includes("entrada")) type = "receita";
    if (parentLower.includes("despesa") || parentLower.includes("gasto")) type = "despesa";

    if (!type) {
      const section = findSection(rows, r, range.e.r);
      if (section === "receita") type = "receita";
      if (section === "despesa") type = "despesa";
    }

    if (!type) continue;

    for (const [month, col] of monthCols) {
      const amount = parseNum(getCell(rows, r, col));
      if (amount === 0) continue;
      await prisma.transaction.create({
        data: {
          date: new Date(YEAR, month - 1, 15),
          description: desc,
          category: desc,
          amount: Math.abs(amount),
          type,
          paymentMethod: "outros",
          month,
          year: YEAR,
          isProjection: false,
        },
      });
      stats.transactions++;
    }
  }
}

function findSection(sheet: XLSX.WorkSheet, row: number, maxRow: number): "receita" | "despesa" | null {
  for (let r = row; r >= Math.max(0, row - 30); r--) {
    const label = String(getCell(sheet, r, 0) || "").toLowerCase();
    if (label.includes("receita") || label.includes("entrada")) return "receita";
    if (label.includes("despesa") || label.includes("gasto")) return "despesa";
  }
  return null;
}

async function importInvestments(sheet: XLSX.WorkSheet, stats: ImportStats) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z200");
  const startRow = 121;
  const endRow = Math.min(139, range.e.r);

  for (let r = startRow; r <= endRow; r++) {
    const name = String(getCell(sheet, r, 0) || "").trim();
    if (!name || name.toLowerCase().includes("investimento")) continue;

    let value = 0;
    let institution = "Não informado";
    let targetPercent = 0;

    for (let c = 1; c <= Math.min(10, range.e.c); c++) {
      const v = getCell(sheet, r, c);
      const num = parseNum(v);
      if (num > value) value = num;
      if (typeof v === "string" && v.length > 2 && !v.match(/^\d/)) institution = v;
      if (num > 0 && num <= 100 && c > 2) targetPercent = num;
    }

    if (value <= 0) continue;

    await prisma.investment.create({
      data: {
        name,
        institution,
        type: detectInvestmentType(name),
        currentValue: value,
        targetPercent,
        risk: "moderado",
        liquidity: detectInvestmentType(name) === "caixa" ? "alta" : "media",
        year: YEAR,
        month: 1,
      },
    });
    stats.investments++;
  }
}

async function importConsortiums(workbook: XLSX.WorkBook, stats: ImportStats) {
  for (const sheetName of workbook.SheetNames) {
    const lower = sheetName.toLowerCase();
    if (!lower.includes("consor") && !lower.includes("consórc")) continue;

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    for (const row of data) {
      const values = Object.values(row).map((v) => String(v));
      const admin = values[0] || "Administradora";
      if (!admin || admin.toLowerCase().includes("administr")) continue;

      const credit = parseNum(values[4] || values[3]);
      const installment = parseNum(values[5] || values[4]);
      if (credit <= 0 && installment <= 0) continue;

      await prisma.consortium.create({
        data: {
          administrator: admin,
          group: String(values[1] || "-"),
          quota: String(values[2] || "-"),
          assetType: String(values[3] || "Bem"),
          contractedCredit: credit || installment * 100,
          installment,
          totalInstallments: parseInt(String(values[6] || 100), 10) || 100,
          paidInstallments: parseInt(String(values[7] || 0), 10) || 0,
          amountPaid: parseNum(values[8]),
          bidOffered: parseNum(values[9]) || null,
          bidAvailable: parseNum(values[10]) || null,
          contemplated: String(values[11] || "").toLowerCase().includes("sim"),
        },
      });
      stats.consortiums++;
    }
  }

  // Fallback: scan main sheet for consortium keywords
  const main = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(main["!ref"] || "A1:Z200");
  for (let r = 0; r <= range.e.r; r++) {
    const label = String(getCell(main, r, 0) || "").toLowerCase();
    if (!label.includes("consórcio") && !label.includes("consorcio")) continue;
    const credit = parseNum(getCell(main, r, 1));
    const paid = parseNum(getCell(main, r, 2));
    if (credit <= 0) continue;
    const exists = await prisma.consortium.findFirst({
      where: { administrator: label.slice(0, 50) },
    });
    if (exists) continue;
    await prisma.consortium.create({
      data: {
        administrator: label.slice(0, 80) || "Consórcio",
        group: "-",
        quota: "-",
        assetType: "Bem",
        contractedCredit: credit,
        installment: paid > 0 ? paid / 12 : credit / 100,
        totalInstallments: 100,
        paidInstallments: 0,
        amountPaid: paid,
      },
    });
    stats.consortiums++;
  }
}

async function importCards(workbook: XLSX.WorkBook, stats: ImportStats) {
  for (const sheetName of workbook.SheetNames) {
    const lower = sheetName.toLowerCase();
    if (!lower.includes("cart")) continue;
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    for (const row of data) {
      const name = String(Object.values(row)[0] || "").trim();
      if (!name || name.toLowerCase().includes("cartão")) continue;
      await prisma.card.create({
        data: {
          name,
          brand: String(Object.values(row)[1] || ""),
          limit: parseNum(Object.values(row)[2]),
        },
      });
      stats.cards++;
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Meu Patrimônio 2026 — Importação Excel");
  console.log("═══════════════════════════════════════════\n");

  if (!fs.existsSync(PLANILHA)) {
    console.error(`❌ Arquivo não encontrado: ${PLANILHA}`);
    console.error("   Coloque planilha.xlsx na raiz do projeto e tente novamente.");
    process.exit(1);
  }

  console.log(`📂 Lendo: ${PLANILHA}`);
  const workbook = XLSX.readFile(PLANILHA);
  console.log(`📋 Abas encontradas: ${workbook.SheetNames.join(", ")}\n`);

  const stats: ImportStats = {
    transactions: 0,
    investments: 0,
    consortiums: 0,
    cards: 0,
    patrimony: 0,
  };

  console.log("🗑️  Limpando dados anteriores de 2026...");
  await clear2026Data();

  const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
  console.log(`📊 Importando lançamentos da aba: ${workbook.SheetNames[0]}`);
  await importFromSheet(mainSheet, workbook.SheetNames[0], stats);

  for (const sheetName of workbook.SheetNames.slice(1)) {
    await importFromSheet(workbook.Sheets[sheetName], sheetName, stats);
  }

  console.log("💰 Importando investimentos (região A122:A140)...");
  await importInvestments(mainSheet, stats);

  console.log("🏢 Importando consórcios...");
  await importConsortiums(workbook, stats);

  console.log("💳 Importando cartões...");
  await importCards(workbook, stats);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  console.log("\n═══════════════════════════════════════════");
  console.log("  RESUMO DA IMPORTAÇÃO — 2026");
  console.log("═══════════════════════════════════════════");
  console.log(`  Lançamentos (receitas/despesas): ${stats.transactions}`);
  console.log(`  Investimentos:                   ${stats.investments}`);
  console.log(`  Consórcios:                      ${stats.consortiums}`);
  console.log(`  Cartões:                         ${stats.cards}`);
  console.log(`  Snapshots de patrimônio:         ${stats.patrimony}`);
  console.log("═══════════════════════════════════════════\n");
  console.log("✅ Importação concluída!");
}

main()
  .catch((e) => {
    console.error("❌ Erro na importação:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
