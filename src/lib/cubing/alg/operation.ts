import { Alg, Move } from "cubing/alg";

export interface ExperimentalCollapseOptions {
  sameDirection?: boolean;
  oppositeDirection?: boolean;
  wideMoves333?: boolean;
  sliceMoves333?: boolean;
  quantumMoveOrder?: number;
}

export function experimentalAppendMove(
  alg: Alg,
  newMove: Move,
  options?: ExperimentalCollapseOptions,
): Alg {
  const oldAlgNodes = Array.from(alg.childAlgNodes());
  const lastMove = oldAlgNodes[oldAlgNodes.length - 1] as Move | undefined;
  const preLastMove = oldAlgNodes[oldAlgNodes.length - 2] as Move | undefined;
  const directionsAligned = lastMove && lastMove.amount * newMove.amount > 0;
  if (
    options?.sliceMoves333 &&
    "xyz".indexOf(newMove.family) !== -1 &&
    lastMove &&
    lastMove.quantum &&
    preLastMove &&
    preLastMove.quantum
  ) {
    const index = "xyz".indexOf(newMove.family);
    const forwardMove = "LDB"[index];
    const inverseMove = "RUF"[index];
    const newAlgNodes = oldAlgNodes.slice(0, oldAlgNodes.length - 2);
    const lastFamily = lastMove.family;
    const preLastFamily = preLastMove.family;
    if (
      (forwardMove === lastFamily && inverseMove === preLastFamily) ||
      (inverseMove === lastFamily && forwardMove === preLastFamily)
    ) {
      if (lastMove.amount === -preLastMove.amount) {
        let checkMove = lastMove;
        if (inverseMove === preLastFamily) {
          checkMove = preLastMove;
        }
        if (checkMove.amount === -newMove.amount) {
          const family = "MES"[index];
          const amount = family === "S" ? newMove.amount : -newMove.amount;
          return experimentalAppendMove(
            new Alg(newAlgNodes),
            newMove.modified({ family, amount }),
            options,
          );
        }
      }
    }
  }
  if (
    options?.wideMoves333 &&
    "xyz".indexOf(newMove.family) !== -1 &&
    lastMove &&
    lastMove.quantum
  ) {
    const index = "xyz".indexOf(newMove.family);
    const forwardMove = "LDB"[index];
    const inverseMove = "RUF"[index];
    const moveAlignment = newMove.amount * lastMove.amount;
    const checkMove = moveAlignment > 0 ? forwardMove : inverseMove;
    const newAlgNodes = oldAlgNodes.slice(0, oldAlgNodes.length - 1);
    const lastFamily = lastMove.family;
    if (checkMove === lastFamily) {
      if (lastMove.amount === newMove.amount) {
        const family = "ruf"[index];
        return experimentalAppendMove(
          new Alg(newAlgNodes),
          lastMove.modified({ family }),
          options,
        );
      }
      if (lastMove.amount === -newMove.amount) {
        const family = "ldb"[index];
        return experimentalAppendMove(
          new Alg(newAlgNodes),
          lastMove.modified({ family }),
          options,
        );
      }
    }
  }
  if (
    ((directionsAligned && options?.sameDirection) ||
      (!directionsAligned && options?.oppositeDirection)) &&
    lastMove &&
    lastMove.quantum &&
    lastMove.quantum.isIdentical(newMove.quantum)
  ) {
    const newAlgNodes = oldAlgNodes.slice(0, oldAlgNodes.length - 1);
    let newAmount = lastMove.amount + newMove.amount;
    const mod = options?.quantumMoveOrder;
    if (mod) {
      newAmount = ((newAmount % mod) + mod) % mod;
      if (newAmount * 2 > mod) {
        newAmount -= mod;
      }
    }
    if (newAmount !== 0) {
      newAlgNodes.push(lastMove.modified({ amount: newAmount }));
    }
    return new Alg(newAlgNodes);
  }
  return new Alg([...oldAlgNodes, newMove]);
}
