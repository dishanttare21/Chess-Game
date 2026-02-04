const socket = io({
    autoConnect: false
});
const chess = new Chess()
const chessBoardElement = document.getElementById('chessBoard');

let currentDragPiece = null;
let sourceSquare = null;
let playerRole = null;
let waitingForPlayer = true;

const startGameBtn = document.getElementById('startGameBtn');
startGameBtn.addEventListener("click", () => {
    socket.connect();
    startGameBtn.classList.add('hidden');
})


const renderBoard = () => {
    const board = chess.board();
    chessBoardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            // console.log(square);
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + squareIndex) % 2 == 0 ? "light" : "dark");

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            //if piece exists on given index(square/i,j)
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece',
                    square.color === "w" ? "white" : "black"
                )

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color && !waitingForPlayer;



                pieceElement.addEventListener("dragstart", () => {
                    if (pieceElement.draggable) {
                        currentDragPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex }
                    }
                })

                pieceElement.addEventListener("dragend", () => {
                    currentDragPiece = null;
                    sourceSquare = null
                })

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            })

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();

                if (currentDragPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    }
                    handleMove(sourceSquare, targetSource);
                }
            })
            chessBoardElement.appendChild(squareElement)
        })
    });

    if (playerRole == 'b') {
        chessBoardElement.classList.add('flipped')
    }

}

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }

    socket.emit("move", move)
}

const getPieceUnicode = (piece) => {
    const pieceUnicodes = {
        K: "♔",  // King
        Q: "♕",  // Queen
        R: "♖",  // Rook
        B: "♗",  // Bishop
        N: "♘",  // Knight
        P: "♙",  // Pawn
        k: "♚",  // King
        q: "♛",  // Queen
        r: "♜",  // Rook
        b: "♝",  // Bishop
        n: "♞",  // Knight
        p: "♟"   // Pawn
    }

    return pieceUnicodes[piece.type] || "";
}

socket.on("waiting", (waiting) => {
    // console.log(waiting);
    waitingForPlayer = waiting
    const infoDiv = document.getElementById('info');
    if (waiting == true) {
        infoDiv.innerText = "Waiting: " + playerRole;
        startGameBtn.classList.remove('hidden');
    } else if (waiting == false) {
        infoDiv.innerText = "Game Started: " + playerRole;
        startGameBtn.classList.add('hidden');
    }
    renderBoard()
})

socket.on("playerRole", (role) => {
    playerRole = role;
    console.log(playerRole);
    // const infoDiv = document.getElementById('info');
    // infoDiv.innerText += ": "+role
    renderBoard();
});

socket.on("spectatorRole", () => {
    console.log('spectator');
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = "Spectator"
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
})

socket.on("move", (move) => {
    chess.move(move);
    console.log(move)
    renderBoard();
})

socket.on("turn", (turn) => {
    console.log(turn);
    const turnDiv = document.getElementById('turn');
    turnDiv.innerHTML = "Turn: " + turn;
    renderBoard();
})

socket.on("gameReset", () => {
    alert("Player disconnected. Game reset.");

    resetValues();

    renderBoard();
});

socket.on("gameOver",(winner) => {
    alert("gameOver! winner is: ", winner);
    resetValues()
})


function resetValues() {
    chess.reset();
    currentDragPiece = null;
    sourceSquare = null;
    playerRole = null;

    chessBoardElement.classList.remove("flipped");

    document.getElementById("info").innerText =
        "";
    const turnDiv = document.getElementById('turn');
    turnDiv.innerHTML = "";
    socket.disconnect();
    startGameBtn.classList.remove('hidden');
}


renderBoard();
