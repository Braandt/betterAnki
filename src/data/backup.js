// data/backup.js

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportWords(words) {
    downloadJson('words.json', words);
}

export function exportPhrases(phrases) {
    downloadJson('phrases.json', phrases);
}

// Downloads both files at once, still as two separate JSON files
export function exportAll(words, phrases) {
    exportWords(words);
    exportPhrases(phrases);
}

export function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(JSON.parse(reader.result));
            } catch (err) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsText(file);
    });
}