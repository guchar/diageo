export function serializeJSON(obj: any): string {
  return JSON.stringify(obj);
}

export function deserializeJSON<T>(str: string): T {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    console.error("Error deserializing JSON:", error);
    throw error;
  }
}
