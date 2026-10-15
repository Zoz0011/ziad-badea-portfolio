import fs from 'node:fs';
import path from 'node:path';
const base = fs.readFileSync('dist/index.html', 'utf8');
for (const [id, name, description] of [
  ['pharmacore', 'PharmaCore', 'A pharmacy management project by Ziad Badea: medicine inventory, barcode POS, purchasing, and reports.'],
  ['safi', 'Safi Debt Ledger', 'An Arabic web and Android debt ledger by Ziad Badea, with account balances, payments, reports, and offline sync.'],
  ['prescripto', 'Prescripto', 'A full-stack medical appointment project with patient, doctor, and administrator interfaces.'],
  ['diacare', 'DiaCare Mom', 'An Arabic Flutter prototype for local personal health records and clinician care-plan references.']
]) {
  const directory = path.join('dist', 'projects', id);
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(path.join(directory, 'index.html'), base.replace('<title>Ziad Badea — Portfolio</title>', `<title>${name} — Ziad Badea</title>`).replace(/(<meta name="description" content=")[^"]+/, `$1${description}`));
}
