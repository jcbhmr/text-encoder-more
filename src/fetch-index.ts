import Index from "./index-object.ts";

async function fetchIndex(url: string, date?: string): Promise<Index> {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new DOMException(
      `${response.url} responded with ${response.status} ${response.statusText}`,
    );
  }
  const contentType = response.headers.get("Content-Type");
  if (contentType == null || !/^text\/plain(?:;|$)/.test(contentType)) {
    throw new DOMException(
      `${response.url} responded with a non-'text/plain' Content-Type: ${contentType}`,
    );
  }
  const text = await response.text();
  const index = new Index(text);
  if (date != null) {
    if (index.date !== date) {
      throw new DOMException(`Expected date ${date} but got ${index.date}`);
    }
  }
  return index;
}

export async function fetchIndexJSON(url: string, date?: string): Promise<[number, number][]> {
  const index = await fetchIndex(url, date);
  return index.toJSON();
}

export async function fetchIndexEncoderRecord(
  url: string,
  date?: string,
): Promise<Record<number, number>> {
  const index = await fetchIndex(url, date);
  return index.toEncoderRecord();
}
