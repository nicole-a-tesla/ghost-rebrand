
export const findAndReplaceAll = (sourceStr: string, searchStr: string, replaceStr: string): string => {
  const safeSearchStr = escapeRegExp(searchStr);
  const regex = new RegExp(safeSearchStr, 'gi');
  return sourceStr.replaceAll(regex, replaceStr);
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}