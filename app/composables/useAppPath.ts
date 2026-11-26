export function useAppPath() {
  const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");

  return (path: string) => {
    if (!path || !path.startsWith("/") || path.startsWith("//")) {
      return path;
    }

    if (baseURL && (path === baseURL || path.startsWith(`${baseURL}/`))) {
      return path;
    }

    return `${baseURL}${path}`;
  };
}
