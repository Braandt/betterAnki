// lib/wordForms.js
export const PARTS_OF_SPEECH = [
    'noun',
    'verb',
    'adjective',
    'adverb',
    'pronoun',
    'preposition',
    'conjunction',
    'interjection',
    'expression',
];

export const FORM_FIELDS = {
    verb: [
        { key: 'infinitive', label: 'Infinitive' },
        { key: 'present', label: 'Present' },
        { key: 'past', label: 'Past' },
        { key: 'pastParticiple', label: 'Past participle' },
    ],
    noun: [
        { key: 'gender', label: 'Gender (en/et/ei)' },
        { key: 'plural', label: 'Plural' },
    ],
    adjective: [
        { key: 'neuter', label: 'Neuter form' },
        { key: 'plural', label: 'Plural form' },
    ],
};