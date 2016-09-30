
import {mapToObject} from "../utils/arrays";
import {int} from "../utils/types";

type Coords = [int, int];
const CELLS: Coords[] = [
    [0,0], [0,1], [0,2],
    [1,0], [1,1], [1,2],
    [2,0], [2,1], [2,2]
];

function coordsToStr(coords: Coords) : string {
    return coords[0] + "," + coords[1];
}

export class CellView {
    element: Element;

    constructor(
        public coords: Coords,
        public domRoot: Element
    ) {
        this.element = document.createElement("img");
        this.element.className = "sign";
        domRoot.appendChild(this.element);
        this.clear();
    }
    clear() {
        this.element.setAttribute("src", "img/empty.svg");
    }
    setX() {
        this.element.setAttribute("src", "img/sign-x.svg");
    }
    setO() {
        this.element.setAttribute("src", "img/sign-o.svg");
    }
}

export class TableView {
    cellViewDict: {[key:string]:CellView};
    cellViewList: CellView[];
    constructor(public domRoot: Element) {
        this.cellViewList = CELLS.map(coords => new CellView(coords, domRoot));
        this.cellViewDict = mapToObject(this.cellViewList, cv => [coordsToStr(cv.coords), cv]);
        this.cellViewList.forEach(cv => {
           cv.element.addEventListener("click", () => {
              if (this.onclick) {
                  this.onclick(cv.coords);
              }
           });
        });
    }
    clear() {
        this.cellViewList.forEach(cv => cv.clear());
    }
    onclick: (coords: Coords) => void = null;
}