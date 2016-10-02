
import {GameController, GameControllerSerializer} from "./game-controller";

export class GameStore {
    constructor(
        public storage : Storage
    ) {}

    saveGame(controller : GameController) : void {
        this.storage.setItem("saved", GameControllerSerializer.serialize(controller));
    }

    hasSavedGame() : boolean {
        return !!this.storage.getItem("saved");
    }

    loadGame() : GameController {
        const stored = this.storage.getItem("saved");
        if (!stored) {
            throw new Error("Can't load game: no stored game");
        }
        return GameControllerSerializer.unserialize(stored);
    }
}

export const LocalStorageGameStore = new GameStore(localStorage);
