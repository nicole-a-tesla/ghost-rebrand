
export const findAndReplaceAll = (sourceStr: string, searchStr: string, replaceStr: string): string => {
  if (searchStr.length === 0) {
    return sourceStr;
  }
  const safeSearchStr = escapeRegExp(searchStr);
  const regex = new RegExp(safeSearchStr, 'g');
  return sourceStr.replaceAll(regex, replaceStr);
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}