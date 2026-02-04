import express from "express";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";


const app = express();

const secondServer = http.createServer(app); // second server linked to app
const io = new Server(secondServer);
const chess = new Chess();
let players = {};
let currentPlayer = null;
let waiting = null;


app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess" });
})

io.on("connection", (socket) => {
    console.log("connected");
    if (!players.white) {
        players.white = socket.id;
        waiting = true;
        socket.emit("playerRole", "w");
        io.emit("waiting", waiting);
    } else if (!players.black) {
        players.black = socket.id;
        waiting = false;
        socket.emit("playerRole", "b");
        io.emit("waiting", waiting);
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);

        if (
            socket.id === players.white ||
            socket.id === players.black
        ) {
            resetGame();
        }
    });



    socket.on("move", (move) => {
        try {


            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            let prevTurn = chess.turn()
            const result = chess.move(move);

            // if move successful then set the current player to turn from engine
            // and emit the event to both the players
            if (result) {
                if(chess.isGameOver()) {
                    console.log(chess.isGameOver())
                    let winner = prevTurn
                    io.emit("gameOver", winner)
                }
                else{
                    currentPlayer = chess.turn();
                    io.emit("move", move);
                    io.emit("turn",chess.turn());
                    io.emit("boardState", chess.fen());
                }

            }
        } catch (error) {
            console.log("invalid move: ", move);
            socket.emit("invalidMove", move);
        }
    })
})

secondServer.listen(3000, () => {
    console.log("Server running at: http://localhost:3000");

})


function resetGame() {
    console.log("Resetting game");

    chess.reset();       // New board
    players = {};        // Clear players
    currentPlayer = null;
    waiting = null;

    io.emit("gameReset");           
    io.emit("boardState", chess.fen());
}



