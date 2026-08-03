// features/study/CustomStudyModal.jsx
import { useState, useMemo } from 'react';
import Modal from '../../components/Modal';
import TagInput from '../../components/TagInput';
import { getAllTags } from '../../lib/tags';
import { isDue } from '../../lib/srs';
import { useApp } from '../../context/AppContext';

export default function CustomStudyModal({ open, onClose, onStart }) {
    const { phrases } = useApp();
    const [tags, setTags] = useState([]);
    const [includeAll, setIncludeAll] = useState(false);
    const allTags = getAllTags(phrases);

    const matchingCount = useMemo(() => {
        return phrases.filter((p) => {
            const dueOk = includeAll || isDue(p);
            const tagsOk = tags.every((t) => (p.tags || []).includes(t));
            return dueOk && tagsOk;
        }).length;
    }, [phrases, tags, includeAll]);

    function handleStart() {
        onStart({ tags, includeAll });
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose} onConfirm={handleStart}>
            <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Custom study</h2>
                <p className="text-sm text-gray-500">Only review phrases that have all of these tags:</p>
                <TagInput tags={tags} onChange={setTags} suggestions={allTags} />

                <label className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <input
                        type="checkbox"
                        checked={includeAll}
                        onChange={(e) => setIncludeAll(e.target.checked)}
                    />
                    Include cards not yet due
                </label>

                <p className="text-sm text-gray-400">
                    {matchingCount} phrase{matchingCount === 1 ? '' : 's'} match
                    {tags.length === 0 ? ' (no tag filter yet)' : ''}
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