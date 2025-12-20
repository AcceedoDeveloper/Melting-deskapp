const xmlSummaryCache = new Map<string, any>();

export function getCachedXmlSummary(filePath: string) {
  return xmlSummaryCache.get(filePath);
}

export function setCachedXmlSummary(filePath: string, data: any) {
  xmlSummaryCache.set(filePath, data);
}
