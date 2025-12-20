import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';

export async function readXmlSummary(filePath: string) {
  const xml = fs.readFileSync(filePath, 'utf16le');

  const json = await parseStringPromise(xml, {
    explicitArray: true,
    trim: true
  });

  const sampleResults =
    json?.SampleResults ||
    json?.['ns:SampleResults'] ||
    Object.values(json)[0]; 

  const sample =
    sampleResults?.SampleResult?.[0] ||
    sampleResults?.SampleResult;

  if (!sample) {
    console.error('❌ SampleResult not found');
    return { headers: [] };
  }

  const sampleIDs =
    sample?.SampleIDs?.[0]?.SampleID ||
    sample?.SampleIDs?.SampleID ||
    [];

  const headers = sampleIDs
    .map(id => ({
      name: id?.IDName?.[0]?.trim(),
      value: id?.IDValue?.[0]?.trim()
    }))
    .filter(h =>
      ['Heat No', 'Stage', 'Grade', 'Part Name'].includes(h.name)
    );

  return { headers };
}
