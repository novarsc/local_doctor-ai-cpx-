import React, { useState, useRef, useEffect } from 'react';

const BlockMemoEditor = ({ value = '', onChange, placeholder = "메모를 작성하세요...", className = "" }) => {
    const [blocks, setBlocks] = useState([{ id: 1, content: value }]);
    const [focusedBlockId, setFocusedBlockId] = useState(1);
    const blockRefs = useRef({});

    // 초기값이 있으면 단일 블록으로 설정 (줄바꿈으로 분할하지 않음)
    useEffect(() => {
        if (value && blocks.length === 1 && blocks[0].content === value) {
            // 줄바꿈으로 분할하지 않고 전체 내용을 하나의 블록으로 설정
            setBlocks([{ id: 1, content: value }]);
        }
    }, [value]);

    // 블록 내용이 변경될 때 부모 컴포넌트에 알림
    useEffect(() => {
        const fullContent = blocks.map(block => block.content).join('\n');
        if (fullContent !== value) {
            onChange?.(fullContent);
        }
    }, [blocks, onChange, value]);

    const handleBlockChange = (blockId, newContent) => {
        setBlocks(prevBlocks => 
            prevBlocks.map(block => 
                block.id === blockId 
                    ? { ...block, content: newContent }
                    : block
            )
        );
    };

    const adjustTextareaHeight = (textarea) => {
        textarea.style.height = 'auto';
        // 최소 높이 60px, 최대 높이 제한 없이 텍스트 길이에 맞춰 조절
        textarea.style.height = Math.max(textarea.scrollHeight, 60) + 'px';
    };

    const handleKeyDown = (e, blockId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentBlockIndex = blocks.findIndex(block => block.id === blockId);
            const newBlockId = Math.max(...blocks.map(b => b.id)) + 1;
            
            // 현재 블록의 모든 내용을 유지하고, 새로운 빈 블록 추가
            const newBlocks = [...blocks];
            
            // 새 블록 삽입 (현재 블록 다음에)
            newBlocks.splice(currentBlockIndex + 1, 0, { id: newBlockId, content: '' });
            
            setBlocks(newBlocks);
            setFocusedBlockId(newBlockId);
            
            // 다음 렌더링 후 새 블록에 포커스
            setTimeout(() => {
                if (blockRefs.current[newBlockId]) {
                    const textarea = blockRefs.current[newBlockId];
                    textarea.focus();
                    adjustTextareaHeight(textarea);
                }
            }, 0);
        } else if (e.key === 'Backspace' && blocks.length > 1) {
            const currentBlockIndex = blocks.findIndex(block => block.id === blockId);
            const currentBlock = blocks[currentBlockIndex];
            
            // 현재 블록이 비어있고 첫 번째 블록이 아닌 경우
            if (currentBlock.content === '' && currentBlockIndex > 0) {
                e.preventDefault();
                e.stopPropagation();
                
                const prevBlock = blocks[currentBlockIndex - 1];
                const newBlocks = [...blocks];
                
                // 이전 블록에 현재 블록 내용 추가 (비어있으므로 의미없음)
                newBlocks[currentBlockIndex - 1] = { 
                    ...prevBlock, 
                    content: prevBlock.content 
                };
                
                // 현재 블록 제거
                newBlocks.splice(currentBlockIndex, 1);
                
                setBlocks(newBlocks);
                setFocusedBlockId(prevBlock.id);
                
                // 다음 렌더링 후 이전 블록에 포커스
                setTimeout(() => {
                    if (blockRefs.current[prevBlock.id]) {
                        const textarea = blockRefs.current[prevBlock.id];
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                        adjustTextareaHeight(textarea);
                    }
                }, 0);
            }
        } else if (e.key === 'ArrowUp' && e.target.selectionStart === 0) {
            // 커서가 맨 위에 있을 때 위 블록으로 이동
            const currentBlockIndex = blocks.findIndex(block => block.id === blockId);
            if (currentBlockIndex > 0) {
                e.preventDefault();
                e.stopPropagation();
                const prevBlock = blocks[currentBlockIndex - 1];
                setFocusedBlockId(prevBlock.id);
                setTimeout(() => {
                    if (blockRefs.current[prevBlock.id]) {
                        const textarea = blockRefs.current[prevBlock.id];
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                    }
                }, 0);
            }
        } else if (e.key === 'ArrowDown' && e.target.selectionStart === e.target.value.length) {
            // 커서가 맨 아래에 있을 때 아래 블록으로 이동
            const currentBlockIndex = blocks.findIndex(block => block.id === blockId);
            if (currentBlockIndex < blocks.length - 1) {
                e.preventDefault();
                e.stopPropagation();
                const nextBlock = blocks[currentBlockIndex + 1];
                setFocusedBlockId(nextBlock.id);
                setTimeout(() => {
                    if (blockRefs.current[nextBlock.id]) {
                        const textarea = blockRefs.current[nextBlock.id];
                        textarea.focus();
                        textarea.setSelectionRange(0, 0);
                    }
                }, 0);
            }
        }
    };

    const addBlock = () => {
        const newBlockId = Math.max(...blocks.map(b => b.id)) + 1;
        const newBlocks = [...blocks, { id: newBlockId, content: '' }];
        setBlocks(newBlocks);
        setFocusedBlockId(newBlockId);
        
        setTimeout(() => {
            if (blockRefs.current[newBlockId]) {
                blockRefs.current[newBlockId].focus();
            }
        }, 0);
    };

    const removeBlock = (blockId) => {
        if (blocks.length > 1) {
            const newBlocks = blocks.filter(block => block.id !== blockId);
            setBlocks(newBlocks);
            
            // 삭제된 블록이 포커스된 블록이었다면 이전 블록에 포커스
            if (focusedBlockId === blockId) {
                const deletedIndex = blocks.findIndex(block => block.id === blockId);
                const newFocusedBlock = newBlocks[Math.max(0, deletedIndex - 1)];
                setFocusedBlockId(newFocusedBlock.id);
                
                setTimeout(() => {
                    if (blockRefs.current[newFocusedBlock.id]) {
                        blockRefs.current[newFocusedBlock.id].focus();
                    }
                }, 0);
            }
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {blocks.map((block, index) => (
                <div key={block.id} className="relative group">
                    <textarea
                        ref={el => blockRefs.current[block.id] = el}
                        value={block.content}
                        onChange={(e) => {
                            handleBlockChange(block.id, e.target.value);
                            adjustTextareaHeight(e.target);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        placeholder={index === 0 ? placeholder : "계속 작성하세요..."}
                        className="w-full min-h-[60px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white transition-all duration-200"
                        style={{ 
                            minHeight: '60px',
                            height: 'auto'
                        }}
                    />
                    {blocks.length > 1 && (
                        <button
                            onClick={() => removeBlock(block.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="블록 삭제"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
            <button
                onClick={addBlock}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                + 새 블록 추가
            </button>
        </div>
    );
};

export default BlockMemoEditor; 