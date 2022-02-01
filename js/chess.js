/*
 @author Joe Chrisman
 */
var whiteOnBottom = true
var engineIsBlack = true

var blackPieces = []
var whitePieces = []

var whiteKing
var blackKing

var pieceMoving
var lastMoved

var whitesTurn = true
// barely turn based. I want to make this an engine

var table // html table element displayed in the browser
var board = Array.from(Array(8), () => new Array(8)); // 2d array of Square to serve as a board structure

var pieceSetup = ['r', 'n', 'b', whiteOnBottom ? 'q' : 'k', whiteOnBottom ? 'k' : 'q', 'b', 'n', 'r']; // how we want the back rank pieces to be set up

document.addEventListener('DOMContentLoaded', function() {
  createDOM()
  createBoard()
  updateDOM()
})

// create chess board in memory
function createBoard() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let piece

      if (row == 0) {
        piece = new Piece(row, col, (whiteOnBottom ? 'b' : 'w') + pieceSetup[col])
      }
      if (row == 7) {
        piece = new Piece(row, col, (whiteOnBottom ? 'w' : 'b') + pieceSetup[col])
      }
      if (row == 1) {
        piece = new Piece(row, col, whiteOnBottom ? 'bp' : 'wp')
      }
      if (row == 6) {
        piece = new Piece(row, col, whiteOnBottom ? 'wp' : 'bp')
      }
      if (piece) {
        addPiece(piece)
      }
      board[row][col] = new Square(row, col, piece)
    }
  }
}

// create chess board in the browser
function createDOM() {
  // html table element for the board
  table = document.createElement('table')
  for (let row = 0; row < 8; row++) {
    // create row for the squares
    let rank = document.createElement('tr')
    for (let col = 0; col < 8; col++) {
      // create square and attach it to the row
      let square = document.createElement('td')

      square.dataset.row = row
      square.dataset.col = col

      // create checkerboard pattern
      square.classList.add(row % 2 == col % 2 ? 'light' : 'dark')

      // add click listener to square
      square.addEventListener('click', onSquareClick)
      // pass square data into anonymous function above
      square.squareData = square

      rank.appendChild(square)
    }
    // attach the row to the table
    table.appendChild(rank)
  }
  // attach the table to the body
  document.body.appendChild(table)
}

// update chess board in browser to match board in memory
function updateDOM() {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let squareData = board[row][col] // chessboard
      let square = table.rows[row].cells[col] // an html td element

      // if there is a piece put it on the square visually
      square.dataset.piece = squareData.piece ? squareData.piece.pieceType : 'null'
    }
  }
}

// when a user clicks a square on the board
function onSquareClick(event) {
  let squareClicked = event.currentTarget.squareData
  let pieceClicked = board[squareClicked.dataset.row][squareClicked.dataset.col].piece

  // if the user clicked on a move option
  if (squareClicked.classList.contains('option')) {
    // move whatever piece the user wants to move
    clearMoveHighlights()
    // parseInt is important so we dont end up doing concatenation when trying to do addition
    movePiece(pieceMoving, parseInt(squareClicked.dataset.row), parseInt(squareClicked.dataset.col))
    // update chessboard in the browser
    whitesTurn = (whitesTurn ? false : true)
    updateDOM()
  } else {
    clearMoveHighlights()
    // if user clicked on his own piece
    // will later be && pieceClicked.isWhite == engineIsBlack
    if (pieceClicked && pieceClicked.isWhite == whitesTurn) {
      // highlight possible moves
      getLegalMoves(pieceClicked).forEach(function(square) {
        table.rows[square.row].cells[square.col].classList.add('option')
      })
      // remember what piece we clicked in case the user chooses an option square
      pieceMoving = pieceClicked
    }
  }
}

// reset square color when done highlighting possible moves
function clearMoveHighlights() {
  document.querySelectorAll('td').forEach(function(square) {
    square.classList.remove('option')
  })
}

class Piece {
  // pieceType is a string like 'wp' where w is white and p is pawn
  constructor(row, col, pieceType) {
    this.isWhite = pieceType[0] == 'w'
    this.pieceType = pieceType
    this.row = row
    this.col = col
    this.timesMoved = 0
  }
}

class Square {
  constructor(row, col, piece) {
    this.row = row
    this.col = col
    this.piece = piece
    this.name = getSquareName(row, col)
  }
}

function addPiece(piece) {
  console.log('adding ' + piece.pieceType)
  // add a king where we need to
  if (piece.pieceType[1] == 'k') {
    if (piece.isWhite) {
      whiteKing = piece
    } else {
      blackKing = piece
    }
  } else {
    (piece.isWhite ? whitePieces : blackPieces).push(piece)
  }

}

function removePiece(pieceToRemove) {
  console.log('removing ' + pieceToRemove.pieceType)
  let pieces = pieceToRemove.isWhite ? whitePieces : blackPieces
  let index = pieces.indexOf(pieceToRemove)
  if (index > -1) {
    pieces.splice(index, 1)
  } else {
    // sometimes a king is captured etc. doesnt cause problems
    console.warn('tried to remove a piece but couldnt find it')
    console.log('tried to remove ' + JSON.stringify(pieceToRemove))
  }
}

function movePiece(piece, targetRow, targetCol) {
  // remove piece from it's square
  board[piece.row][piece.col].piece = null
  // keep track of what we capture and promote to
  let captured = board[targetRow][targetCol].piece
  let promoted

  // if we are moving a pawn
  if (piece.pieceType[1] == 'p') {
    // if we are promoting a pawn
    if (targetRow == 0 || targetRow == 7) {
      // remove pawn we promoted
      piece.timesMoved++ // because movePieceBack offsets for this
      removePiece(piece)
      // remember queen we promoted
      promoted = new Piece(targetRow, targetCol, piece.isWhite ? 'wq' : 'bq')
      addPiece(promoted)
      piece = promoted
    }
    // if we are capturing a pawn en passant
    else if (!captured && targetCol != piece.col) {
      // remember pawn we captured
      captured = board[piece.row][targetCol].piece
      board[piece.row][targetCol].piece = null
    }
  }

  // if we are castling a king
  if (piece.pieceType[1] == 'k' && Math.abs(piece.col - targetCol) > 1) {
    // if we are castling left
    if (targetCol == 1 || targetCol == 2) {
      // move left rook to right of king
      board[targetRow][targetCol + 1].piece = board[targetRow][0].piece
      board[targetRow][0].piece = null
      board[targetRow][targetCol + 1].piece.timesMoved++
      board[targetRow][targetCol + 1].piece.col = targetCol + 1
    }
    // if we are castling right
    if (targetCol == 5 || targetCol == 6) {
      // move right rook to left of king
      board[targetRow][targetCol - 1].piece = board[targetRow][7].piece
      board[targetRow][7].piece = null
      board[targetRow][targetCol - 1].piece.timesMoved++
      board[targetRow][targetCol - 1].piece.col = targetCol - 1
    }
  }

  if (captured) {
    removePiece(captured)
  }

  if (promoted) {
    lastMoved = promoted
  } else {
    lastMoved = piece
  }

  // move piece to it's destination
  piece.row = targetRow
  piece.col = targetCol
  piece.timesMoved++
  board[targetRow][targetCol].piece = piece

  // so we can know how to undo this move cleanly
  return {captured: captured, promoted: promoted}
}

function movePieceBack(piece, captured, promoted, targetRow, targetCol) {
  piece.timesMoved--
  // if we want to undo promotion
  if (promoted) {
    // make sure to remove promotions
    removePiece(promoted)

    board[promoted.row][promoted.col].piece = captured
    // make sure to add promoted pawn back
    addPiece(piece)
  }

  // replace captured piece
  // captures can include en passant
  board[piece.row][piece.col].piece = null

  if (captured) {
    addPiece(captured)
    board[captured.row][captured.col].piece = captured
  }

  // if we want to uncastle
  if (piece.pieceType[1] == 'k' && Math.abs(piece.col - targetCol) > 1) {
    // if we are uncastling from the left
    if (piece.col == 1 || piece.col == 2) {
      // move rook right of king to the left
      board[targetRow][piece.col + 1].piece.timesMoved--
      board[targetRow][piece.col + 1].piece.col = 0
      board[targetRow][0].piece = board[targetRow][piece.col + 1].piece
      board[targetRow][piece.col + 1].piece = null
    }
    // if we are uncastling from the right
    if (piece.col == 5 || piece.col == 6) {
      // move rook left of king to the right
      board[targetRow][piece.col - 1].piece.timesMoved--
      board[targetRow][piece.col - 1].piece.col = 7
      board[targetRow][7].piece = board[targetRow][piece.col - 1].piece
      board[targetRow][piece.col - 1].piece = null
    }
  }

  // move piece back to where it came from
  piece.row = targetRow
  piece.col = targetCol
  board[targetRow][targetCol].piece = piece
  lastMoved = null

}

// get a square's notation given a coordinate pair
function getSquareName(row, col) {
  if (!whiteOnBottom) {
    row = 7 - row
    col = 7 - col
  }
  return String.fromCharCode(97 + col) + (8 - row)
}



// If we moved a piece, and we are in check, that move was illegal
// also this function stops illegal castling out of and over check
function filterIllegalMoves(pieceMoved, king, originalCol) {
  // get opponents pieces
  let pieces = king.isWhite ? blackPieces : whitePieces
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
    // get all of opponents raw moves
    let moves = getPseudoLegalMoves(pieces[pieceIndex])
    for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
      let move = moves[moveIndex]
      // dont let us put ourselves in check
      if (move.piece == king) {
        return true
      }
      // dont let us castle over check
      if (pieceMoved == king && Math.abs(originalCol - king.col) > 1) {
        // if we are castling right
        if (king.col == 5 || king.col == 6) {
          for (let col = originalCol; col < king.col; col++) {
            // dont castle right over or out of check
            console.log('filtering right castle square ' + board[king.row][col].name)
            if (move.row == king.row && move.col == col) {
              return true
            }
          }
        }
        // if we are castling left
        else {
          for (let col = originalCol; col > king.col; col--) {
            // dont castle left over or out of check
            console.log('filtering left castle square ' + board[king.row][col].name)

            if (move.row == king.row && move.col == col) {
              return true
            }
          }
        }
      }
    }
  }
  return false

}

function getLegalMoves(piece) {

  let originalRow = piece.row
  let originalCol = piece.col

  let moves = []
  // get raw moves for the piece
  getPseudoLegalMoves(piece).forEach(function(move) {

    // move the piece(s). this includes operations such as en passant and promoting and castling
    let changes = movePiece(piece, move.row, move.col)

    let captured = changes['captured'] // piece captured if we captured one
    let promoted = changes['promoted'] // the queen we promoted to if we promoted

    // if we are in check after moving a piece, moving that piece was illegal
    // this also accounts for illegaly castling over or out of check
    if (!filterIllegalMoves(piece, piece.isWhite ? whiteKing : blackKing, originalCol)) {
      moves.push(move)
    }
    // this function hopefully perfectly undos any type of move operation
    movePieceBack(piece, captured, promoted, originalRow, originalCol)
  })
  return moves
}

// get legal moves by piece
// returns an array of Square class
function getPseudoLegalMoves(piece) {
  let moves = []

  // if piece is a pawn
  if (piece.pieceType[1] == 'p') {
    // figure out which way this pawn is moving
    let direction = piece.isWhite == whiteOnBottom ? -1 : 1

    // check for right and left captures
    let right = board[piece.row + direction][piece.col + 1]
    let left = board[piece.row + direction][piece.col - 1]

    if (right && right.piece && right.piece.isWhite != piece.isWhite) {
      moves.push(right)
    }
    if (left && left.piece && left.piece.isWhite != piece.isWhite) {
      moves.push(left)
    }

    // check for pushing one square
    let inFront = board[piece.row + direction][piece.col]
    if (inFront && !inFront.piece) {
      moves.push(inFront)
      // check for pushing two squares
      if (piece.timesMoved == 0) {
        let twoInFront = board[piece.row + (2 * direction)][piece.col]
        if (twoInFront && !twoInFront.piece) {
          moves.push(twoInFront)
        }
      }
    }

    // check for en passant
    if (direction == -1 && piece.row == 3 || direction == 1 && piece.row == 4) {
      let left = board[piece.row][piece.col - 1]
      let right = board[piece.row][piece.col + 1]
      if (left && left.piece && left.piece == lastMoved) {
        // if we have a left en passant capture
        if (left.piece.pieceType[1] == 'p' && left.piece.isWhite != piece.isWhite && left.piece.timesMoved == 1) {
          moves.push(board[piece.row + direction][piece.col - 1])
        }
      }
      if (right && right.piece && right.piece == lastMoved) {
        // if we have a right en passant capture
        if (right.piece.pieceType[1] == 'p' && right.piece.isWhite != piece.isWhite && right.piece.timesMoved == 1) {
          moves.push(board[piece.row + direction][piece.col + 1])
        }
      }
    }
  }
  // if the piece is a knight
  if (piece.pieceType[1] == 'n') {
    // translations for knight movement
    translations = [
      [-1, -2],
      [1, -2],
      [-1, 2],
      [1, 2],
      [-2, 1],
      [-2, -1],
      [2, 1],
      [2, -1]
    ]
    // generate knight moves
    for (let i = 0; i < 8; i++) {
      let translation = translations[i]
      let newRow = piece.row + translation[0]
      let newCol = piece.col + translation[1]
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        target = board[newRow][newCol]
        // make sure we dont capture our own pieces
        if (target) {
          if (!target.piece) {
            moves.push(target)
          } else if (target.piece.isWhite != piece.isWhite) {
            moves.push(target)
          }
        }
      }
    }
  }

  // code duplication - who cares
  // if the piece is a bishop or queen
  if (piece.pieceType[1] == 'b' || piece.pieceType[1] == 'q') {
    // search upper left diagonal
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row - distance
      let x = piece.col - distance
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[y][x].piece) {
          if (board[y][x].piece.isWhite != piece.isWhite) {
            moves.push(board[y][x])
          }
          break
        }
        moves.push(board[y][x])
      } else {
        break
      }
    }
    // search upper right diagonal
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row - distance
      let x = piece.col + distance
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[y][x].piece) {
          if (board[y][x].piece.isWhite != piece.isWhite) {
            moves.push(board[y][x])
          }
          break
        }
        moves.push(board[y][x])
      } else {
        break
      }
    }
    // search lower left diagonal
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row + distance
      let x = piece.col - distance
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[y][x].piece) {
          if (board[y][x].piece.isWhite != piece.isWhite) {
            moves.push(board[y][x])
          }
          break
        }
        moves.push(board[y][x])

      } else {
        break
      }
    }
    // search lower right diagonal
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row + distance
      let x = piece.col + distance
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        if (board[y][x].piece) {
          if (board[y][x].piece.isWhite != piece.isWhite) {
            moves.push(board[y][x])
          }
          break
        }
        moves.push(board[y][x])

      } else {
        break
      }
    }
  }

  // if piece is a rook or a queen
  if (piece.pieceType[1] == 'r' || piece.pieceType[1] == 'q') {
    // search up the file
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row + distance
      if (y >= 0 && y < 8) {
        if (board[y][piece.col].piece) {
          if (board[y][piece.col].piece.isWhite != piece.isWhite) {
            moves.push(board[y][piece.col])
          }
          break
        }
        moves.push(board[y][piece.col])
      } else {
        break
      }
    }
    // search down the file
    for (let distance = 1; distance < 8; distance++) {
      let y = piece.row - distance
      if (y >= 0 && y < 8) {
        if (board[y][piece.col].piece) {
          if (board[y][piece.col].piece.isWhite != piece.isWhite) {
            moves.push(board[y][piece.col])
          }
          break
        }
        moves.push(board[y][piece.col])
      } else {
        break
      }
    }
    // search left through the rank
    for (let distance = 1; distance < 8; distance++) {
      let x = piece.col - distance
      if (x >= 0 && x < 8) {
        if (board[piece.row][x].piece) {
          if (board[piece.row][x].piece.isWhite != piece.isWhite) {
            moves.push(board[piece.row][x])
          }
          break
        }
        moves.push(board[piece.row][x])
      } else {
        break
      }
    }
    // search right through the rank
    for (let distance = 1; distance < 8; distance++) {
      let x = piece.col + distance
      if (x >= 0 && x < 8) {
        if (board[piece.row][x].piece) {
          if (board[piece.row][x].piece.isWhite != piece.isWhite) {
            moves.push(board[piece.row][x])
          }
          break
        }
        moves.push(board[piece.row][x])
      } else {
        break
      }
    }
  }

  // if the piece is a king
  if (piece.pieceType[1] == 'k') {
    // check squares one square around the king in all directions
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        // dont include the king's own square as a move
        if (x == 0 && y == 0) {
          continue
        }
        // make sure move is within the bounds of the board
        if (piece.col + x >= 0 && piece.col + x < 8 && piece.row + y >= 0 && piece.row + y < 8) {
          let target = board[piece.row + y][piece.col + x]
          // if we moved to a square with a piece on it
          if (target.piece) {
            // if we captured a piece
            if (target.piece.isWhite != piece.isWhite) {
              moves.push(board[piece.row + y][piece.col + x])
            }
          } else {
            moves.push(board[piece.row + y][piece.col + x])
          }

        }
      }
    }

    // check for castling rights
    if (piece.timesMoved == 0) {
      // check for rooks nessesary
      let leftRook = board[piece.row][0].piece;
      let rightRook = board[piece.row][7].piece;
      let canCastleLeft = leftRook && leftRook.isWhite == piece.isWhite && leftRook.timesMoved == 0
      let canCastleRight = rightRook && rightRook.isWhite == piece.isWhite && rightRook.timesMoved == 0

      // make sure no pieces are in the way of left castling
      if (canCastleLeft) {
        for (let x = leftRook.col + 1; x < piece.col; x++) {
          if (board[piece.row][x].piece != null) {
            canCastleLeft = false
            break
          }
        }
      }

      // make sure no pieces are in the way of right castling
      if (canCastleRight) {
        for (let x = rightRook.col - 1; x > piece.col; x--) {
          if (board[piece.row][x].piece != null) {
            canCastleRight = false
            break
          }
        }
      }

      if (canCastleLeft) {
        moves.push(board[piece.row][piece.col - 2])
      }
      if (canCastleRight) {
        moves.push(board[piece.row][piece.col + 2])
      }
    }
  }

  return moves
}
