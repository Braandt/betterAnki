// scripts/migrate.js
// One-time migration: reads your old local words.json / phrases.json / audio/
// folder and inserts everything into Supabase. Run with:
//   node scripts/migrate.js /path/to/your/old/data/folder

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

const dataDir = process.argv[2];
if (!dataDir) {
    console.error('Usage: node scripts/migrate.js /path/to/folder-with-words-and-phrases-json');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

function wordToDb(w) {
    return {
        id: w.id,
        text: w.text,
        definition: w.definition,
        notes: w.notes || '',
        created_at: new Date(w.createdAt || Date.now()).toISOString(),
    };
}

function phraseToDb(p) {
    return {
        id: p.id,
        text: p.text,
        answer: p.answer || '',
        tags: p.tags || [],
        type: p.type || 'flip',
        cloze_indices: p.clozeIndices || [],
        has_audio: !!p.hasAudio,
        srs: p.srs || { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        created_at: new Date(p.createdAt || Date.now()).toISOString(),
    };
}

async function migrateWords() {
    const raw = await readFile(path.join(dataDir, 'words.json'), 'utf-8');
    const words = JSON.parse(raw);
    if (words.length === 0) {
        console.log('No words to migrate.');
        return;
    }
    const { error } = await supabase.from('words').insert(words.map(wordToDb));
    if (error) throw error;
    console.log(`Migrated ${words.length} words.`);
}

async function migratePhrases() {
    const raw = await readFile(path.join(dataDir, 'phrases.json'), 'utf-8');
    const phrases = JSON.parse(raw);
    if (phrases.length === 0) {
        console.log('No phrases to migrate.');
        return;
    }
    const { error } = await supabase.from('phrases').insert(phrases.map(phraseToDb));
    if (error) throw error;
    console.log(`Migrated ${phrases.length} phrases.`);
}

async function migrateAudio() {
    const audioDir = path.join(dataDir, 'audio');
    let files;
    try {
        files = await readdir(audioDir);
    } catch {
        console.log('No audio folder found, skipping.');
        return;
    }

    for (const file of files) {
        if (!file.endsWith('.webm')) continue;
        const filePath = path.join(audioDir, file);
        const buffer = await readFile(filePath);
        const { error } = await supabase.storage
            .from('audio')
            .upload(file, buffer, { contentType: 'audio/webm', upsert: true });
        if (error) {
            console.error(`Failed to upload ${file}:`, error.message);
        } else {
            console.log(`Uploaded ${file}`);
        }
    }
}

async function main() {
    console.log('Starting migration from', dataDir);
    await migrateWords();
    await migratePhrases();
    await migrateAudio();
    console.log('Done.');
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});