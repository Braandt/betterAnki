// features/study/CustomStudyModal.jsx
import { useState, useMemo, useEffect } from 'react';
import Modal from '../../components/Modal';
import TagInput from '../../components/TagInput';
import { getAllTags } from '../../lib/tags';
import { isDue } from '../../lib/srs';
import { phraseContainsWord } from '../../lib/phraseWords';
import { getWeakWords } from '../../lib/wordMastery';
import { useApp } from '../../context/AppContext';

export default function CustomStudyModal({ open, onClose, onStart, initialWords = [] }) {
    const { phrases, words } = useApp();
    const [tags, setTags] = useState([]);
    const [filterWords, setFilterWords] = useState([]);
    const [includeAll, setIncludeAll] = useState(false);
    const [weakOnly, setWeakOnly] = useState(false);

    const allTags = getAllTags(phrases);
    const allWordTexts = useMemo(() => words.map((w) => w.text).sort(), [words]);
    const weakWords = useMemo(() => getWeakWords(words), [words]);

    useEffect(() => {
        if (open) {
            setFilterWords(initialWords);
            setTags([]);
            setIncludeAll(false);
            setWeakOnly(false);
        }
    }, [open, initialWords]);

    // Effective word filter: manual selection normally, or every weak word when the toggle is on.
    // Turning weakOnly on clears any manual word picks, since they'd otherwise conflict.
    const effectiveWords = weakOnly ? weakWords : filterWords;

    const matchingCount = useMemo(() => {
        return phrases.filter((p) => {
            const dueOk = includeAll || isDue(p);
            const tagsOk = tags.every((t) => (p.tags || []).includes(t));
            const wordsOk = effectiveWords.length === 0 || effectiveWords.some((w) => phraseContainsWord(p, w));
            return dueOk && tagsOk && wordsOk;
        }).length;
    }, [phrases, tags, effectiveWords, includeAll]);

    function handleStart() {
        onStart({ tags, words: effectiveWords, includeAll });
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose} onConfirm={handleStart}>
            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Custom study</h2>

                <div>
                    <p className="text-sm text-gray-500 mb-1">Must have all of these tags:</p>
                    <TagInput tags={tags} onChange={setTags} suggestions={allTags} placeholder="Add tags..." />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-500">Must contain any of these words:</p>
                    </div>
                    <TagInput
                        tags={filterWords}
                        onChange={setFilterWords}
                        suggestions={allWordTexts}
                        placeholder="Add words..."
                        disabled={weakOnly}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={weakOnly}
                        onChange={(e) => {
                            setWeakOnly(e.target.checked);
                            if (e.target.checked) setFilterWords([]); // avoid a confusing mix of manual + auto
                        }}
                    />
                    Only weak words ({weakWords.length} word{weakWords.length === 1 ? '' : 's'} below mastery threshold)
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} />
                    Include cards not yet due
                </label>

                <p className="text-sm text-gray-400">
                    {matchingCount} phrase{matchingCount === 1 ? '' : 's'} match
                </p>

                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-gray-500">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleStart}
                        disabled={matchingCount === 0}
                        className="bg-blue-600 text-white rounded px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Start ({matchingCount})
                    </button>
                </div>
            </div>
        </Modal>
    );
}