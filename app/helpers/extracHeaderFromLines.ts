export function extractHeaderFromLines(lines: string[]) {
  const header: any = {};

  const pickNext = (label: string) => {
    const idx = lines.findIndex(l => l === label);
    if (idx === -1) return '';
    return lines[idx + 1] ?? '';
  };

  header.partName        = pickNext('Part name');
  header.drawingNumber  = pickNext('Drawing number');
  header.customerName   = pickNext('Customer name');
  header.purpose        = pickNext('Purpose');
  header.company        = pickNext('Company');
  header.department     = pickNext('Department');
  header.cmmType        = pickNext('CMM Type');
  header.cmmNo          = pickNext('CMM No.');
  header.partIdent      = pickNext('Part ident');
  header.timeDate       = pickNext('Time/Date');
  header.run            = pickNext('Run');
  header.measuredValues = pickNext('No. measured values');
  header.redValues      = pickNext('No. values: red');

  header.lastMeasurements = lines.find(l => l.startsWith('Last')) || '';
  header.approvalStatus   = lines.find(l => l === 'Approval') ? 'Approval ≠ Blocked' : '';

  return header;
}
