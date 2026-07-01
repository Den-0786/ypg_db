/**
 * Prompts the user to choose a save location using the File System Access API.
 * Falls back to automatic download if the browser doesn't support it.
 *
 * @param {Blob} blob - The file content as a Blob
 * @param {string} suggestedName - Default file name
 * @param {string} mimeType - MIME type for the file
 */
export async function saveFileWithPicker(blob, suggestedName, mimeType) {
  // Map of format extensions to MIME types for the file picker
  const fileTypes = getFileTypes(suggestedName, mimeType);

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: fileTypes,
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // User cancelled the dialog
      if (err.name === "AbortError") {
        return false;
      }
      // If showSaveFilePicker fails for another reason, fall through to fallback
      console.warn("showSaveFilePicker failed, using fallback:", err);
    }
  }

  // Fallback: automatic download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

function getFileTypes(filename, mimeType) {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "csv":
      return [
        {
          description: "CSV File",
          accept: { "text/csv": [".csv"] },
        },
      ];
    case "xlsx":
      return [
        {
          description: "Excel Spreadsheet",
          accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          },
        },
      ];
    case "pdf":
      return [
        {
          description: "PDF Document",
          accept: { "application/pdf": [".pdf"] },
        },
      ];
    default:
      return [
        {
          description: "File",
          accept: { [mimeType || "application/octet-stream"]: [`.${ext}`] },
        },
      ];
  }
}
