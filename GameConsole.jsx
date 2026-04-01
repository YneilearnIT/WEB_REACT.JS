import { useState, useEffect } from 'react';
import './GameConsole.css';

const GAME_LIST = [
  { id: 'CARO_5', name: 'CARO HÀNG 5', winCount: 5, initialSize: 10, help: 'Luân phiên đánh X và O. Hàng 5 liên tiếp sẽ thắng.' },
  { id: 'CARO_4', name: 'CARO HÀNG 4', winCount: 4, initialSize: 10, help: 'Luân phiên đánh X và O. Hàng 4 liên tiếp sẽ thắng.' },
  { id: 'TICTACTOE', name: 'TIC-TAC-TOE', winCount: 3, initialSize: 3, help: 'Bàn cờ 3x3. Nối 3 liên tiếp sẽ thắng.' },
  { id: 'DRAWING', name: 'BẢNG VẼ TỰ DO', initialSize: 15, help: 'Di chuyển con trỏ và bấm Enter để tô màu. Không tính thắng thua.' },
  { id: 'MEMORY', name: 'CỜ TRÍ NHỚ', initialSize: 4, help: 'Di chuyển và bấm Enter lật 2 thẻ bài giống nhau để ghi điểm.' },
  { id: 'SNAKE', name: 'RẮN SĂN MỒI', initialSize: 15, help: 'Sử dụng 4 nút điều hướng để di chuyển. Ăn táo để tăng điểm.' },
  { id: 'MATCH3', name: 'GHÉP HÀNG 3', initialSize: 8, help: 'Chọn 1 viên kẹo, di chuyển sang kẹo kế bên và Chọn để đổi chỗ.' }
];

const CANDIES = ['🔴', '🟡', '🟢', '🔵', '🟣'];

const GameConsole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [gameState, setGameState] = useState('MENU');
  const [menuIndex, setMenuIndex] = useState(0); 
  const [activeGame, setActiveGame] = useState(null); 
  
  // --- STATE CHUNG ---
  const [boardSize, setBoardSize] = useState(10);
  const [board, setBoard] = useState(Array(100).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [cursor, setCursor] = useState(44);
  const [winner, setWinner] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [sysMessage, setSysMessage] = useState('');

  // --- STATE CỜ TRÍ NHỚ ---
  const [memoryDeck, setMemoryDeck] = useState([]); 
  const [flippedCards, setFlippedCards] = useState([]); 
  const [matchedCards, setMatchedCards] = useState([]);

  // --- STATE RẮN SĂN MỒI ---
  const [snakeState, setSnakeState] = useState({ body: [], food: null, dir: 'UP', isRunning: false, speed: 200 });

  // --- STATE GHÉP HÀNG 3 (MATCH-3) ---
  const [selectedCandy, setSelectedCandy] = useState(null);
  const [match3Trigger, setMatch3Trigger] = useState(0); // Dùng để kích hoạt vòng lặp xóa kẹo và rơi xuống

  const clearMessageOnAction = () => { if (sysMessage) setSysMessage(''); };

  const saveScoreToRanking = async (finalScore) => {
    try {
      if (!user || !user.id) return; 
      await fetch('http://localhost:5000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, game_name: activeGame.name, score: finalScore, time_elapsed: timeElapsed })
      });
    } catch (err) { console.log('Loi luu diem:', err); }
  };

  const handleSaveGame = () => {
    clearMessageOnAction();
    if (gameState !== 'PLAYING' || activeGame?.id === 'DRAWING') {
      setSysMessage('Chỉ có thể Lưu khi đang trong trận đấu.'); return;
    }
    const saveData = { 
      activeGame, boardSize, board, isXNext, cursor, timeElapsed, score, winner,
      memoryDeck, flippedCards, matchedCards, snakeState, selectedCandy 
    };
    localStorage.setItem('saved_game_data', JSON.stringify(saveData));
    setSysMessage('Đã lưu tiến trình trận đấu.');
  };

  const handleLoadGame = () => {
    clearMessageOnAction();
    const data = localStorage.getItem('saved_game_data');
    if (!data) { setSysMessage('Không tìm thấy dữ liệu đã lưu.'); return; }
    
    const parsed = JSON.parse(data);
    setActiveGame(parsed.activeGame);
    setBoardSize(parsed.boardSize);
    setBoard(parsed.board);
    setIsXNext(parsed.isXNext);
    setCursor(parsed.cursor);
    setTimeElapsed(parsed.timeElapsed);
    setScore(parsed.score);
    setWinner(parsed.winner || null);
    
    if (parsed.memoryDeck) {
      setMemoryDeck(parsed.memoryDeck);
      setFlippedCards(parsed.flippedCards || []);
      setMatchedCards(parsed.matchedCards || []);
    }
    if (parsed.snakeState) setSnakeState(parsed.snakeState);
    if (parsed.selectedCandy !== undefined) setSelectedCandy(parsed.selectedCandy);

    setGameState('PLAYING');
    setSysMessage('Đã tải lại ván đấu cũ.');
  };

  // --- LOGIC TÌM VÀ XÓA KẸO (MATCH 3) ---
  const getMatches = (currentBoard, size) => {
    let matchedIndices = new Set();
    // Kiểm tra hàng ngang
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 2; c++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx+1] && currentBoard[idx] === currentBoard[idx+2]) {
          matchedIndices.add(idx).add(idx+1).add(idx+2);
          let k = 3;
          while (c + k < size && currentBoard[idx] === currentBoard[idx+k]) { matchedIndices.add(idx+k); k++; }
        }
      }
    }
    // Kiểm tra hàng dọc
    for (let c = 0; c < size; c++) {
      for (let r = 0; r < size - 2; r++) {
        let idx = r * size + c;
        if (currentBoard[idx] && currentBoard[idx] === currentBoard[idx+size] && currentBoard[idx] === currentBoard[idx+size*2]) {
          matchedIndices.add(idx).add(idx+size).add(idx+size*2);
          let k = 3;
          while (r + k < size && currentBoard[idx] === currentBoard[idx+k*size]) { matchedIndices.add(idx+k*size); k++; }
        }
      }
    }
    return Array.from(matchedIndices);
  };

  const applyGravity = (currentBoard, size) => {
    let newB = [...currentBoard];
    for (let c = 0; c < size; c++) {
      let colItems = [];
      for (let r = size - 1; r >= 0; r--) {
        if (newB[r * size + c] !== null) colItems.push(newB[r * size + c]);
      }
      while (colItems.length < size) {
        colItems.push(CANDIES[Math.floor(Math.random() * CANDIES.length)]);
      }
      for (let r = size - 1; r >= 0; r--) {
        newB[r * size + c] = colItems[size - 1 - r];
      }
    }
    return newB;
  };

  // Vòng lặp hiệu ứng rơi và combo ăn liên hoàn cho Match 3
  useEffect(() => {
    if (activeGame?.id !== 'MATCH3' || gameState !== 'PLAYING') return;
    let timeout1, timeout2;

    const processMatches = () => {
      const matches = getMatches(board, boardSize);
      if (matches.length > 0) {
        let tempBoard = [...board];
        matches.forEach(i => tempBoard[i] = null); // Làm biến mất kẹo
        setBoard(tempBoard);
        setScore(s => s + matches.length * 10); // Mỗi viên = 10 điểm

        // Kẹo mới rơi xuống sau 300ms
        timeout2 = setTimeout(() => {
          const droppedBoard = applyGravity(tempBoard, boardSize);
          setBoard(droppedBoard);
          setMatch3Trigger(prev => prev + 1); // Tiếp tục check xem kẹo rơi xuống có tạo combo không
        }, 300);
      }
    };

    if (match3Trigger > 0) {
      timeout1 = setTimeout(processMatches, 300);
    }
    return () => { clearTimeout(timeout1); clearTimeout(timeout2); };
  }, [match3Trigger, board, activeGame, gameState, boardSize]);

  // Timer đếm thời gian
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && !winner && activeGame?.id !== 'DRAWING' && !showHelp) {
      timer = setInterval(() => setTimeElapsed(p => p + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, winner, activeGame, showHelp]);

  // Game Loop cho Rắn Săn Mồi
  useEffect(() => {
    if (gameState !== 'PLAYING' || activeGame?.id !== 'SNAKE' || winner || !snakeState.isRunning || showHelp) return;
    const interval = setInterval(() => {
      setSnakeState(prev => {
        const { body, food, dir, speed } = prev;
        const head = body[0];
        let nextHead = head;
        const size = boardSize;

        if (dir === 'UP') nextHead = head - size;
        if (dir === 'DOWN') nextHead = head + size;
        if (dir === 'LEFT') nextHead = head - 1;
        if (dir === 'RIGHT') nextHead = head + 1;

        if ((dir === 'UP' && nextHead < 0) || (dir === 'DOWN' && nextHead >= size * size) || 
            (dir === 'LEFT' && head % size === 0) || (dir === 'RIGHT' && (head + 1) % size === 0) || 
            body.includes(nextHead)) {
          setWinner('MÁY THẮNG'); 
          return { ...prev, isRunning: false };
        }

        const newBody = [nextHead, ...body];
        let newFood = food;
        let newSpeed = speed;

        if (nextHead === food) {
          do { newFood = Math.floor(Math.random() * (size * size)); } while (newBody.includes(newFood));
          newSpeed = Math.max(80, speed - 5); 
          setScore(s => s + 10);
        } else {
          newBody.pop(); 
        }
        return { ...prev, body: newBody, food: newFood, speed: newSpeed };
      });
    }, snakeState.speed);
    return () => clearInterval(interval);
  }, [gameState, activeGame, winner, boardSize, snakeState.isRunning, snakeState.speed, showHelp]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- LOGIC BOT CARO/TIC-TAC-TOE ---
  const countInLine = (currentBoard, size, index, dRow, dCol) => {
    const player = currentBoard[index];
    const row = Math.floor(index / size);
    const col = index % size;
    let count = 0;
    for (let i = 1; i <= 5; i++) {
      const r = row + dRow * i;
      const c = col + dCol * i;
      if (r >= 0 && r < size && c >= 0 && c < size && currentBoard[r * size + c] === player) count++; else break;
    }
    return count;
  };

  const checkWinner = (currentBoard, size, index, winRequirement) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let [dRow, dCol] of directions) {
      if (countInLine(currentBoard, size, index, dRow, dCol) + countInLine(currentBoard, size, index, -dRow, -dCol) + 1 >= winRequirement) {
        return currentBoard[index];
      }
    }
    return null;
  };

  const findBestMove = (currentBoard, size, winRequirement) => {
    const emptyCells = currentBoard.map((cell, idx) => cell === null ? idx : null).filter(val => val !== null);
    let bestBlockMove = null, maxBlockCount = 0;
    let bestWinMove = null, maxWinCount = 0;

    for (const moveIndex of emptyCells) {
      currentBoard[moveIndex] = 'O'; 
      if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'O') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = 'X'; 
      if (checkWinner(currentBoard, size, moveIndex, winRequirement) === 'X') { currentBoard[moveIndex] = null; return moveIndex; }
      currentBoard[moveIndex] = null; 

      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let [dRow, dCol] of directions) {
        currentBoard[moveIndex] = 'X'; 
        const playerLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (playerLine > maxBlockCount) { maxBlockCount = playerLine; bestBlockMove = moveIndex; }
        currentBoard[moveIndex] = 'O'; 
        const botLine = countInLine(currentBoard, size, moveIndex, dRow, dCol) + countInLine(currentBoard, size, moveIndex, -dRow, -dCol);
        if (botLine > maxWinCount) { maxWinCount = botLine; bestWinMove = moveIndex; }
        currentBoard[moveIndex] = null; 
      }
    }
    if (maxBlockCount >= winRequirement - 2) return bestBlockMove; 
    if (maxWinCount >= winRequirement - 2) return bestWinMove;
    if (maxBlockCount >= Math.max(1, winRequirement - 3)) return bestBlockMove;
    if (emptyCells.length === 0) return null; 
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  };

  const startGame = () => {
    const game = GAME_LIST[menuIndex];
    setActiveGame(game);
    setBoardSize(game.initialSize);
    
    if (game.id === 'MEMORY') {
      const symbols = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🥝', '🍍'];
      const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5); 
      setMemoryDeck(deck);
      setBoard(Array(16).fill(null)); 
      setFlippedCards([]); setMatchedCards([]); setWinner(null);
    } else if (game.id === 'SNAKE') {
      const startPos = Math.floor((game.initialSize * game.initialSize) / 2);
      setSnakeState({ body: [startPos, startPos + game.initialSize], food: 10, dir: 'UP', isRunning: false, speed: 200 });
      setBoard(Array(game.initialSize * game.initialSize).fill(null));
      setWinner(null);
    } else if (game.id === 'MATCH3') {
      // Khởi tạo bàn kẹo không có sẵn hàng 3
      let newB = Array(64).fill(null);
      for(let i=0; i<64; i++) {
        let randomCandy;
        do {
          randomCandy = CANDIES[Math.floor(Math.random() * CANDIES.length)];
          let row = Math.floor(i/8); let col = i%8;
          let mLeft = col >= 2 && newB[i-1] === randomCandy && newB[i-2] === randomCandy;
          let mUp = row >= 2 && newB[i-8] === randomCandy && newB[i-16] === randomCandy;
          if(!mLeft && !mUp) break;
        } while(true);
        newB[i] = randomCandy;
      }
      setBoard(newB);
      setSelectedCandy(null);
      setWinner(null);
    } else {
      setBoard(Array(game.initialSize * game.initialSize).fill(null));
      setWinner(null);
    }

    setCursor(Math.floor((game.initialSize * game.initialSize) / 2));
    setIsXNext(true); setTimeElapsed(0); setScore(0); setSysMessage(''); setGameState('PLAYING');
  };

  const backToMenu = () => { clearMessageOnAction(); setGameState('MENU'); setActiveGame(null); };

  // --- HÀM XỬ LÝ 4 NÚT ĐIỀU HƯỚNG ---
  const moveCursor = (direction) => {
    if (showHelp) return; 
    clearMessageOnAction();

    if (gameState === 'MENU') {
      if (direction === 'LEFT') setMenuIndex(prev => (prev === 0 ? GAME_LIST.length - 1 : prev - 1));
      if (direction === 'RIGHT') setMenuIndex(prev => (prev === GAME_LIST.length - 1 ? 0 : prev + 1));
      return;
    }

    if (winner) return; 
    
    if (activeGame?.id === 'SNAKE') {
      setSnakeState(prev => {
        let newDir = prev.dir;
        if (direction === 'UP' && prev.dir !== 'DOWN') newDir = 'UP';
        if (direction === 'DOWN' && prev.dir !== 'UP') newDir = 'DOWN';
        if (direction === 'LEFT' && prev.dir !== 'RIGHT') newDir = 'LEFT';
        if (direction === 'RIGHT' && prev.dir !== 'LEFT') newDir = 'RIGHT';
        return { ...prev, dir: newDir, isRunning: true }; 
      });
      return;
    }

    if (!isXNext) return; 
    setCursor((prev) => {
      const totalCells = boardSize * boardSize;
      if (direction === 'UP' && prev >= boardSize) return prev - boardSize;
      if (direction === 'DOWN' && prev < totalCells - boardSize) return prev + boardSize;
      if (direction === 'LEFT') return (prev - 1 + totalCells) % totalCells;
      if (direction === 'RIGHT') return (prev + 1) % totalCells;
      return prev;
    });
  };

  // --- HÀM XỬ LÝ NÚT CHỌN (ENTER) ---
  const handleEnter = () => {
    if (showHelp) return; 
    clearMessageOnAction();

    if (gameState === 'MENU') { startGame(); return; }
    if (winner) { startGame(); return; }
    if (activeGame?.id === 'SNAKE' || !isXNext) return; 
    
    // Bảng vẽ
    if (activeGame.id === 'DRAWING') {
      const newBoard = [...board];
      newBoard[cursor] = newBoard[cursor] === null ? 'X' : newBoard[cursor] === 'X' ? 'O' : null;
      setBoard(newBoard); return;
    }

    // Ghép hàng 3 (Match 3)
    if (activeGame.id === 'MATCH3') {
      if (selectedCandy === null) {
        setSelectedCandy(cursor); // Lần bấm 1: Chọn kẹo
      } else {
        // Lần bấm 2: Kiểm tra xem có bấm cạnh kẹo đã chọn không
        const r1 = Math.floor(selectedCandy / boardSize); const c1 = selectedCandy % boardSize;
        const r2 = Math.floor(cursor / boardSize); const c2 = cursor % boardSize;
        const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

        if (isAdjacent) {
          let tempBoard = [...board];
          let temp = tempBoard[selectedCandy];
          tempBoard[selectedCandy] = tempBoard[cursor];
          tempBoard[cursor] = temp;

          // Kiểm tra xem đổi chỗ xong có tạo hàng 3 không
          let matches = getMatches(tempBoard, boardSize);
          if (matches.length > 0) {
            setBoard(tempBoard); // Nếu hợp lệ thì cho đổi
            setSelectedCandy(null);
            setMatch3Trigger(prev => prev + 1); // Kích hoạt hiệu ứng vỡ kẹo
          } else {
            setSelectedCandy(null); // Không hợp lệ thì tự hủy chọn
          }
        } else {
          setSelectedCandy(cursor); // Bấm ra chỗ xa thì đổi kẹo đang chọn sang kẹo mới
        }
      }
      return;
    }

    // Cờ Trí Nhớ
    if (activeGame.id === 'MEMORY') {
      if (flippedCards.includes(cursor) || matchedCards.includes(cursor) || flippedCards.length === 2) return;
      const newFlipped = [...flippedCards, cursor];
      setFlippedCards(newFlipped);

      if (newFlipped.length === 2) {
        const [firstIndex, secondIndex] = newFlipped;
        if (memoryDeck[firstIndex] === memoryDeck[secondIndex]) {
          const newMatched = [...matchedCards, firstIndex, secondIndex];
          setMatchedCards(newMatched); setFlippedCards([]); setScore(prev => prev + 20);
          if (newMatched.length === boardSize * boardSize) {
            setWinner('X'); saveScoreToRanking(score + 20);
          }
        } else { setTimeout(() => { setFlippedCards([]); }, 800); }
      }
      return; 
    }

    // Caro / Tic-tac-toe
    if (board[cursor] !== null) return;
    
    const newBoard = [...board];
    newBoard[cursor] = 'X';
    setBoard(newBoard);
    
    const playerWin = checkWinner(newBoard, boardSize, cursor, activeGame.winCount);
    if (playerWin) { setWinner('X'); setScore(100); saveScoreToRanking(100); return; }
    if (!newBoard.includes(null)) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); return; }

    setIsXNext(false); 
    setTimeout(() => {
      const smartMove = findBestMove(newBoard, boardSize, activeGame.winCount);
      if (smartMove === null) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); return; }
      
      const botBoard = [...newBoard];
      botBoard[smartMove] = 'O';
      setBoard(botBoard);
      
      const botWin = checkWinner(botBoard, boardSize, smartMove, activeGame.winCount);
      if (botWin) { setWinner('O'); setScore(0); saveScoreToRanking(0); } 
      else if (!botBoard.includes(null)) { setWinner('DRAW'); setScore(10); saveScoreToRanking(10); } 
      else { setIsXNext(true); }
    }, 400); 
  };

  return (
    <div className="modern-console-system">
      <div className="display-wrapper">
        <div className="game-info-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span className="player-name">{user.username || 'Người chơi'}</span>
            {gameState === 'PLAYING' && !winner && !['DRAWING', 'SNAKE', 'MATCH3'].includes(activeGame?.id) && (
              <span className="turn-text" style={{ marginLeft: '10px' }}>
                <span className={`turn-marker ${isXNext ? 'x' : 'o'}`}></span>
                <strong>{isXNext ? 'Lượt của bạn' : 'Máy đang nghĩ'}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {gameState === 'PLAYING' && (
               <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 'bold' }}>
                  <span style={{ marginRight: '10px' }}>THỜI GIAN: <span style={{ color: 'white' }}>{formatTime(timeElapsed)}</span></span>
                  <span>ĐIỂM: <span style={{ color: '#FBBF24' }}>{score}</span></span>
               </div>
            )}
            <div className="sys-btn-group">
               <button className="sys-btn" onClick={handleSaveGame}>LƯU</button>
               <button className="sys-btn" onClick={handleLoadGame}>TẢI</button>
            </div>
          </div>
        </div>

        <div style={{ minHeight: '20px', textAlign: 'center', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#FB923C', letterSpacing: '1px' }}>
          {sysMessage}
        </div>
        
        {gameState === 'MENU' ? (
          <div className="menu-title">
            <span style={{ fontSize: '1rem', letterSpacing: '2px' }}>CHỌN TRÒ CHƠI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap', marginTop:'10px' }}>
              <span style={{ color: '#94A3B8' }}>&lt;&lt;</span>
              <strong>{GAME_LIST[menuIndex].name}</strong>
              <span style={{ color: '#94A3B8' }}>&gt;&gt;</span>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
            <div className="modern-board" style={{ display: 'grid', gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)`, width: '100%', height: '100%', gap: '1px' }}>
              {board.map((cell, index) => {
                const isSelectedMatch3 = activeGame?.id === 'MATCH3' && selectedCandy === index;
                return (
                  <div 
                    key={index} 
                    className={`modern-cell ${gameState === 'PLAYING' && index === cursor && activeGame?.id !== 'SNAKE' ? 'cursor' : ''}`}
                    style={isSelectedMatch3 ? { border: '2px solid #FBBF24', transform: 'scale(1.15)', zIndex: 5, backgroundColor: 'rgba(251, 191, 36, 0.2)' } : {}}
                  >
                    
                    {activeGame?.id === 'SNAKE' ? (
                      <span className="cell-content" style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>
                        {snakeState.body[0] === index ? '😋' : snakeState.body.includes(index) ? '🟩' : snakeState.food === index ? '🍎' : ''}
                      </span>
                    ) : activeGame?.id === 'MEMORY' ? (
                      (flippedCards.includes(index) || matchedCards.includes(index)) && (
                        <span className="cell-content" style={{ fontSize: '30px' }}>{memoryDeck[index]}</span>
                      )
                    ) : (
                      cell && (
                        <span className={`cell-content ${cell === 'X' ? 'x' : 'o'}`} style={{ fontSize: `${Math.max(14, 200 / boardSize)}px` }}>
                          {activeGame?.id === 'DRAWING' ? '█' : cell}
                        </span>
                      )
                    )}

                  </div>
                );
              })}
            </div>

            {winner && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0F172A', border: '2px solid #38BDF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: winner === 'X' ? '#38BDF8' : winner === 'O' || winner === 'MÁY THẮNG' ? '#EF4444' : '#FBBF24', marginBottom: '15px' }}>
                  {winner === 'COMING_SOON' ? 'ĐANG CẬP NHẬT' : winner === 'DRAW' ? 'HÒA CỜ' : winner === 'X' ? 'BẠN THẮNG' : 'GAME OVER'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '15px', fontWeight: 'bold' }}>
                  {winner === 'COMING_SOON' ? 'QUAY LẠI SAU NHÉ' : 'BẤM ENTER ĐỂ TIẾP TỤC'}
                </div>
                {winner !== 'COMING_SOON' && (
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                    ĐIỂM: <span style={{ color: '#FBBF24' }}>{score}</span> | THỜI GIAN: <span style={{ color: 'white' }}>{formatTime(timeElapsed)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showHelp && (
           <div style={{ position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)', background: '#1E293B', border: '1px solid #38BDF8', padding: '15px', width: '220px', zIndex: 100, textAlign: 'center' }}>
             <div style={{ color: '#FB923C', fontWeight: 'bold', marginBottom: '10px' }}>{gameState === 'MENU' ? GAME_LIST[menuIndex].name : activeGame.name}</div>
             <div style={{ color: '#E2E8F0', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'left' }}>{gameState === 'MENU' ? GAME_LIST[menuIndex].help : activeGame.help}</div>
             <button onClick={() => setShowHelp(false)} style={{ background: '#38BDF8', color: '#0F172A', border: 'none', padding: '5px 15px', fontWeight: 'bold', cursor: 'pointer' }}>ĐÓNG</button>
           </div>
        )}
      </div>

      <div className="modern-controller">
        {gameState === 'MENU' ? (
          <div className="nav-menu-panel" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
            <div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button></div>
            <div className="btn-wrapper"><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button></div>
          </div>
        ) : (
          <div className="d-pad-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
            <div className="btn-wrapper" style={{gridColumn: 2, gridRow: 1}}><button className="flat-btn" onClick={() => moveCursor('UP')}>↑</button></div>
            <div className="btn-wrapper" style={{gridColumn: 1, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('LEFT')}>←</button></div>
            <div className="btn-wrapper" style={{gridColumn: 2, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('DOWN')}>↓</button></div>
            <div className="btn-wrapper" style={{gridColumn: 3, gridRow: 2}}><button className="flat-btn" onClick={() => moveCursor('RIGHT')}>→</button></div>
          </div>
        )}

        <div className="flat-btn-group" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <div className="btn-wrapper"><button className="flat-action-btn yellow" onClick={backToMenu}>⮌</button><span className="btn-label">Quay lại</span></div>
          <div className="btn-wrapper"><button className="flat-action-btn red" onClick={handleEnter}>↵</button><span className="btn-label">Chọn</span></div>
          <div className="btn-wrapper"><button className="flat-action-btn blue" onClick={() => setShowHelp(true)}>?</button><span className="btn-label">Trợ giúp</span></div>
        </div>
      </div>
    </div>
  );
};

export default GameConsole;