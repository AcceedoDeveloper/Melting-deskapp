import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { getCachedXmlSummary, setCachedXmlSummary } from './xml-cache';

export async function readXmlSummary(filePath: string) {

  const cached = getCachedXmlSummary(filePath);
  if (cached) {
    return cached;
  }

  const xml = await fs.promises.readFile(filePath, 'utf16le');

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

  if (!sample) return { headers: [] };

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

  const result = { headers };

  setCachedXmlSummary(filePath, result);

  return result;
}
