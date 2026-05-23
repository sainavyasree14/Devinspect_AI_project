const LANGUAGE_EXT = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  csharp: "cs",
};

export const getCodeExtension = (language) =>
  LANGUAGE_EXT[String(language || "javascript").toLowerCase()] || "txt";

export const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};