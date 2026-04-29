import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';


const Table = ({ head, body, loading, hasMore, onLoadMore, scrollContainerRef }) => {
    const sentinelRef = useRef(null);

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore?.();
                }
            },
            { threshold: 0.1, root: scrollContainerRef?.current || null }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, onLoadMore, scrollContainerRef]);

    return (
        <table className="table">
            <thead>
                <tr>
                    {head?.map((col) =>
                        col.value ? <th key={col.key}>{col.value}</th> : null
                    )}
                </tr>
            </thead>
            <tbody>
                {body?.map((row, i) => (
                    <tr key={i}>
                        {head.map((col) => (
                            <td key={col.key}>{row[col.key]}</td>
                        ))}
                    </tr>
                ))}
                {hasMore && (
                    <tr ref={sentinelRef}>
                        <td colSpan={head?.length || 1} style={{ textAlign: 'center', padding: '8px', color: '#888' }}>
                            {loading ? 'Loading…' : 'Scroll for more'}
                        </td>
                    </tr>
                )}
                {!hasMore && body?.length > 0 && (
                    <tr>
                        <td colSpan={head?.length || 1} style={{ textAlign: 'center', padding: '8px', color: '#888' }}>
                            All {body.length} rows loaded
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

Table.propTypes = {
    head: PropTypes.array,
    body: PropTypes.array,
    loading: PropTypes.bool,
    hasMore: PropTypes.bool,
    onLoadMore: PropTypes.func,
    scrollContainerRef: PropTypes.object
};

Table.defaultProps = {
    head: [],
    body: [],
    loading: false,
    hasMore: false
};

export default Table;
