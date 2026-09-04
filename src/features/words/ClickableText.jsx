import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';
import WordSpan from './WordSpan';
import ExpressionSpan from './ExpressionSpan';
import { findExpressionMatches, buildExpressionIndex } from '../../lib/expressions';

export default function ClickableText({ text, onPracticeWord, confirmedExpressions = [] }) {
    const { wordDict } = useApp();
    const tokens = tokenize(text);
    const allMatches = findExpressionMatches(tokens, wordDict);
    const confirmedMatches = allMatches.filter((m) => confirmedExpressions.includes(m.key));
    const expressionIndex = buildExpressionIndex(confirmedMatches);

    return (
        <p className="font-voice text-2xl leading-relaxed text-left text-ink mx-4">
            {tokens.map((token, i) => {
                if (!token.isWord) return <span key={i}>{token.text}</span>;
                const match = expressionIndex.get(i);
                return match ? (
                    <ExpressionSpan key={i} token={token} match={match} allTokens={tokens} onPracticeWord={onPracticeWord} />
                ) : (
                    <WordSpan key={i} token={token} onPracticeWord={onPracticeWord} />
                );
            })}
        </p>
    );
}