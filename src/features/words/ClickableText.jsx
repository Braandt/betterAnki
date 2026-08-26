// features/words/ClickableText.jsx
import { tokenize } from '../../lib/tokenize';
import WordSpan from './WordSpan';

export default function ClickableText({ text, onPracticeWord }) {
    const tokens = tokenize(text);

    return (
        <p className="font-voice text-2xl leading-relaxed text-center text-ink">
            {tokens.map((token, i) =>
                token.isWord ? (
                    <WordSpan key={i} token={token} onPracticeWord={onPracticeWord} />
                ) : (
                    <span key={i}>{token.text}</span>
                )
            )}
        </p>
    );
}